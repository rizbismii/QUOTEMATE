-- Enable live quote sync across phones and browsers.
do $$
begin
  alter publication supabase_realtime add table public.workspaces;
exception
  when duplicate_object then null;
end $$;
