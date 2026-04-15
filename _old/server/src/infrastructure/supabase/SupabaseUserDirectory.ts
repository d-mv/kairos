import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { UserDirectory, UserDirectoryEntry } from "../../domain/collaboration/index.js";

function toEntry(user: User): UserDirectoryEntry | null {
  if (!user.email) return null;
  return { id: user.id, email: user.email };
}

export class SupabaseUserDirectory implements UserDirectory {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<UserDirectoryEntry | null> {
    const { data, error } = await this.client.auth.admin.getUserById(id);
    if (error || !data.user) return null;
    return toEntry(data.user);
  }

  async findByEmail(email: string): Promise<UserDirectoryEntry | null> {
    const normalized = email.trim().toLowerCase();
    let page = 1;

    while (true) {
      const { data, error } = await this.client.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return null;
      const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
      if (match) return toEntry(match);
      if (data.users.length < 200) return null;
      page += 1;
    }
  }
}
