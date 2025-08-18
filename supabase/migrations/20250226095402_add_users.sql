create table if not exists user_roles (
    user_role_id uuid primary key default gen_random_uuid(),
    user_role_name text not null
);

create table if not exists users (
  user_id uuid references auth.users not null primary key,
  first_name text,
  last_name text,
  phone_number text,
  user_role_id uuid not null references user_roles(user_role_id)
);

