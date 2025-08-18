create table if not exists porton.profiles (
    id uuid references auth.users not null primary key,
    role text,
    first_name text,
    last_name text,
    phone_number text,
    created_at TIMESTAMP DEFAULT NOW()
);


create function porton.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into porton.profiles (id, first_name, last_name, role)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name', 'reception');
  return new;
end;
$$;

create trigger proton_on_auth_user_created
  after insert on auth.users
  for each row execute procedure porton.handle_new_user();