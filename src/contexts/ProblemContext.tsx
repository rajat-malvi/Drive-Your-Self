import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { updateUserProfile } from '../services/userService';
import { useAuth } from './AuthContext';

interface ProblemNote {
  problemId: string;
  note: string;
}

interface ProblemContextType {
  completedProblems: string[];
  markProblemCompleted: (problemId: string) => void;
  dailyStats: {
    problemsSolved: number;
    streak: number;
    longestStreak: number;
  };
  problemNotes: ProblemNote[];
  saveProblemNote: (problemId: string, note: string) => Promise<void>;
  getProblemNote: (problemId: string) => string | undefined;
}

const ProblemContext = createContext<ProblemContextType | undefined>(undefined);

export const useProblems = () => {
  const context = useContext(ProblemContext);
  if (!context) {
    throw new Error('useProblems must be used within a ProblemProvider');
  }
  return context;
};

interface ProblemProviderProps {
  children: ReactNode;
}

export const ProblemProvider: React.FC<ProblemProviderProps> = ({ children }) => {
  const [completedProblems, setCompletedProblems] = useState<string[]>([]);
  const [problemNotes, setProblemNotes] = useState<ProblemNote[]>([]);
  const [dailyStats, setDailyStats] = useState({
    problemsSolved: 0,
    streak: 0,
    longestStreak: 0
  });
  const { user, userProfile } = useAuth();

  // Load user data from Supabase
  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        try {
          // Load completed problems
          const { data: problemsData, error: problemsError } = await supabase
            .from('completed_problems')
            .select('problem_id')
            .eq('user_id', user.id);

          if (!problemsError && problemsData) {
            setCompletedProblems(problemsData.map(item => item.problem_id));
          } else if (problemsError) {
            console.error('Error loading completed problems:', problemsError);
          }

          // Load problem notes
          const { data: notesData, error: notesError } = await supabase
            .from('problem_notes')
            .select('problem_id, note')
            .eq('user_id', user.id);

          if (!notesError && notesData) {
            setProblemNotes(notesData.map(item => ({
              problemId: item.problem_id,
              note: item.note
            })));
          } else if (notesError) {
            console.error('Error loading problem notes:', notesError);
          }

          // Load today's activity - get accurate count of unique problems completed today
          const today = new Date().toISOString().split('T')[0];

          // Get problems completed today
          const { data: todayProblems, error: todayError } = await supabase
            .from('completed_problems')
            .select('problem_id')
            .eq('user_id', user.id)
            .gte('completed_at', `${today}T00:00:00Z`)
            .lte('completed_at', `${today}T23:59:59Z`);

          // Count of unique problems completed today
          const uniqueTodayProblemsCount = todayError ? 0 : new Set(todayProblems?.map(p => p.problem_id) || []).size;

          // Load user profile for streak info
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('streak_count, longest_streak')
            .eq('user_id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error loading user profile:', profileError);
          }

          if (!profileError && profileData) {
            setDailyStats({
              problemsSolved: uniqueTodayProblemsCount,
              streak: profileData.streak_count,
              longestStreak: profileData.longest_streak
            });
          }
        } catch (error) {
          console.error('Error in loadUserData:', error);
        }
      };

      loadUserData();
    }
  }, [user]);

  const markProblemCompleted = async (problemId: string) => {
    if (!user || !userProfile) {
      console.warn('User not initialized yet');
      return;
    }

    const isCompleting = !completedProblems.includes(problemId);

    try {
      // Update local state immediately for a responsive UI
      setCompletedProblems(prev => {
        if (prev.includes(problemId)) {
          return prev.filter(id => id !== problemId);
        }
        return [...prev, problemId];
      });

      if (isCompleting) {
        const today = new Date().toISOString().split('T')[0];

        // Add to completed_problems
        await supabase
          .from('completed_problems')
          .insert([{ user_id: user.id, problem_id: problemId }]);

        // Update or create daily activity
        const { data: existingActivity } = await supabase
          .from('daily_activity')
          .select('id, problems_solved')
          .eq('user_id', user.id)
          .eq('activity_date', today)
          .single();

        // Get the unique problem IDs completed today
        const { data: todayProblems, error: todayError } = await supabase
          .from('completed_problems')
          .select('problem_id')
          .eq('user_id', user.id)
          .gte('completed_at', `${today}T00:00:00Z`)
          .lte('completed_at', `${today}T23:59:59Z`);

        if (!todayError && todayProblems) {
          // Count unique problems completed today
          const uniqueTodayProblems = new Set(todayProblems.map(p => p.problem_id));

          // Update daily stats with the accurate count
          setDailyStats(prev => ({
            ...prev,
            problemsSolved: uniqueTodayProblems.size
          }));
        } else {
          // Fallback to incrementing if we can't get the accurate count
          setDailyStats(prev => ({
            ...prev,
            problemsSolved: prev.problemsSolved + 1
          }));
        }

        if (existingActivity) {
          await supabase
            .from('daily_activity')
            .update({ problems_solved: existingActivity.problems_solved + 1 })
            .eq('id', existingActivity.id);
        } else {
          await supabase
            .from('daily_activity')
            .insert([{ user_id: user.id, activity_date: today, problems_solved: 1 }]);
        }

        // Update user profile
        await updateUserProfile(user.id, {
          problems_solved: userProfile.problems_solved + 1,
          total_submissions: userProfile.total_submissions + 1,
          last_submission_date: today
        });
      } else {
        // Remove from completed_problems
        await supabase
          .from('completed_problems')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_id', problemId);

        const today = new Date().toISOString().split('T')[0];

        // Get the unique problem IDs completed today after removal
        const { data: todayProblems, error: todayError } = await supabase
          .from('completed_problems')
          .select('problem_id')
          .eq('user_id', user.id)
          .gte('completed_at', `${today}T00:00:00Z`)
          .lte('completed_at', `${today}T23:59:59Z`);

        if (!todayError && todayProblems) {
          // Count unique problems completed today
          const uniqueTodayProblems = new Set(todayProblems.map(p => p.problem_id));

          // Update daily stats with the accurate count
          setDailyStats(prev => ({
            ...prev,
            problemsSolved: uniqueTodayProblems.size
          }));
        } else {
          // Fallback to decrementing if we can't get the accurate count
          setDailyStats(prev => ({
            ...prev,
            problemsSolved: Math.max(0, prev.problemsSolved - 1)
          }));
        }

        // Update daily activity in database
        const { data: existingActivity } = await supabase
          .from('daily_activity')
          .select('id, problems_solved')
          .eq('user_id', user.id)
          .eq('activity_date', today)
          .single();

        if (existingActivity && existingActivity.problems_solved > 0) {
          await supabase
            .from('daily_activity')
            .update({ problems_solved: existingActivity.problems_solved - 1 })
            .eq('id', existingActivity.id);
        }

        // Update user profile
        await updateUserProfile(user.id, {
          problems_solved: Math.max(0, userProfile.problems_solved - 1)
        });
      }
    } catch (error) {
      console.error('Error updating problem status:', error);

      // Revert the local state changes if there was an error
      setCompletedProblems(prev => {
        if (isCompleting) {
          return prev.filter(id => id !== problemId);
        }
        return [...prev, problemId];
      });

      // Also revert the dailyStats change
      setDailyStats(prev => ({
        ...prev,
        problemsSolved: isCompleting ? Math.max(0, prev.problemsSolved - 1) : prev.problemsSolved + 1
      }));
    }
  };

  const saveProblemNote = async (problemId: string, note: string) => {
    if (!user) {
      throw new Error('User session not initialized');
    }

    try {
      // Check if note already exists
      const { data: existingNote, error: fetchError } = await supabase
        .from('problem_notes')
        .select('id')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing note:', fetchError);
        throw fetchError;
      }

      let result;
      if (existingNote) {
        // Update existing note
        result = await supabase
          .from('problem_notes')
          .update({ note, updated_at: new Date().toISOString() })
          .eq('id', existingNote.id);
      } else {
        // Insert new note
        result = await supabase
          .from('problem_notes')
          .insert([{ user_id: user.id, problem_id: problemId, note }]);
      }

      if (result.error) {
        console.error('Error saving note:', result.error);
        throw result.error;
      }

      // Update local state
      setProblemNotes(prev => {
        const newNotes = [...prev];
        const existingIndex = newNotes.findIndex(n => n.problemId === problemId);

        if (existingIndex >= 0) {
          newNotes[existingIndex] = { problemId, note };
        } else {
          newNotes.push({ problemId, note });
        }

        return newNotes;
      });
    } catch (error) {
      console.error('Error in saveProblemNote:', error);
      throw error;
    }
  };
  };

  const getProblemNote = (problemId: string): string | undefined => {
    const note = problemNotes.find(n => n.problemId === problemId);
    return note?.note;
  };

  return (
    <ProblemContext.Provider value={{
      completedProblems,
      markProblemCompleted,
      dailyStats,
      problemNotes,
      saveProblemNote,
      getProblemNote
    }}>
      {children}
    </ProblemContext.Provider>
  );
};
