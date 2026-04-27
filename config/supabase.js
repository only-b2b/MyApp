import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpqwfmujnrkyaufhutmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXdmbXVqbnJreWF1Zmh1dG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4Njg4OTgsImV4cCI6MjA5MDQ0NDg5OH0.Qm6R7rgd6wTeJnRoC0GrQcmDOazZ64CFBDc3cJ_hiqQ'; // ⚠️ Use your REAL key from dashboard

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});