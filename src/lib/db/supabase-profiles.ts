import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfileDatabase, ProfileRecord } from "@/lib/db/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
};

function mapProfile(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    isActive: row.is_active,
  };
}

export function createSupabaseProfileDatabase(
  client: SupabaseClient,
): ProfileDatabase {
  return {
    async findByEmail(email) {
      const { data, error } = await client
        .from("profiles")
        .select("id, email, display_name, role, is_active")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data ? mapProfile(data) : null;
    },

    async countActive() {
      const { count, error } = await client
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (error) {
        throw new Error(error.message);
      }

      return count ?? 0;
    },

    async create(data) {
      const { data: row, error } = await client
        .from("profiles")
        .insert({
          ...(data.id ? { id: data.id } : {}),
          email: data.email,
          display_name: data.displayName,
          role: data.role,
          is_active: true,
        })
        .select("id, email, display_name, role, is_active")
        .single();

      if (error || !row) {
        throw new Error(error?.message ?? "Could not create profile.");
      }

      return mapProfile(row);
    },

    async setRole(id, role) {
      const { data: row, error } = await client
        .from("profiles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, email, display_name, role, is_active")
        .single();

      if (error || !row) {
        throw new Error(error?.message ?? "Could not update profile role.");
      }

      return mapProfile(row);
    },

    async listMembers() {
      const { data, error } = await client
        .from("profiles")
        .select("id, email, display_name, role, is_active")
        .eq("is_active", true)
        .order("display_name", { ascending: true })
        .order("email", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map(mapProfile);
    },

    async updateDisplayName(id, displayName) {
      const { data: row, error } = await client
        .from("profiles")
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("id, email, display_name, role, is_active")
        .single();

      if (error || !row) {
        throw new Error(error?.message ?? "Could not update name.");
      }

      return mapProfile(row);
    },
  };
}

export async function getProfileDatabase(): Promise<ProfileDatabase> {
  return createSupabaseProfileDatabase(await createSupabaseServerClient());
}
