'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/bot/db/supabase';

export async function updateAnyClientTaskStatus(taskId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('client_tasks')
    .update({ status })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/lucid-os');
}
