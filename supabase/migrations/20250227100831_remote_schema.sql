revoke delete on table "public"."test" from "anon";

revoke insert on table "public"."test" from "anon";

revoke references on table "public"."test" from "anon";

revoke select on table "public"."test" from "anon";

revoke trigger on table "public"."test" from "anon";

revoke truncate on table "public"."test" from "anon";

revoke update on table "public"."test" from "anon";

revoke delete on table "public"."test" from "authenticated";

revoke insert on table "public"."test" from "authenticated";

revoke references on table "public"."test" from "authenticated";

revoke select on table "public"."test" from "authenticated";

revoke trigger on table "public"."test" from "authenticated";

revoke truncate on table "public"."test" from "authenticated";

revoke update on table "public"."test" from "authenticated";

revoke delete on table "public"."test" from "service_role";

revoke insert on table "public"."test" from "service_role";

revoke references on table "public"."test" from "service_role";

revoke select on table "public"."test" from "service_role";

revoke trigger on table "public"."test" from "service_role";

revoke truncate on table "public"."test" from "service_role";

revoke update on table "public"."test" from "service_role";

alter table "public"."test" drop constraint "test_pkey";

drop index if exists "public"."test_pkey";

drop table "public"."test";

create table "public"."event_groups" (
    "event_group_id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "user_id" uuid not null
);


create table "public"."event_types" (
    "event_type_id" uuid not null default gen_random_uuid(),
    "event_type_name" text not null
);


create table "public"."events" (
    "event_id" uuid not null default gen_random_uuid(),
    "event_name" text not null,
    "venue_status_id" uuid not null
);


create table "public"."user_roles" (
    "user_role_id" uuid not null default gen_random_uuid(),
    "user_role_name" text not null
);


create table "public"."users" (
    "user_id" uuid not null,
    "first_name" text,
    "last_name" text,
    "phone_number" text,
    "user_role_id" uuid not null
);


create table "public"."venue_status_states" (
    "venue_status_state_id" uuid not null default gen_random_uuid(),
    "venue_status_state_name" text not null
);


create table "public"."venue_status_types" (
    "venue_status_type_id" uuid not null default gen_random_uuid(),
    "venue_status_type_name" text not null
);


create table "public"."venue_statuses" (
    "venue_status_id" uuid not null default gen_random_uuid(),
    "venue_status_type_id" uuid not null,
    "venue_id" uuid not null,
    "venue_status_state_id" uuid,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone
);


create table "public"."venue_types" (
    "venue_types_id" uuid not null default gen_random_uuid(),
    "venue_type_name" text not null
);


create table "public"."venues" (
    "venue_id" uuid not null default gen_random_uuid(),
    "venue_name" text not null,
    "venue_types_id" uuid not null
);


CREATE UNIQUE INDEX event_groups_event_id_user_id_key ON public.event_groups USING btree (event_id, user_id);

CREATE UNIQUE INDEX event_groups_pkey ON public.event_groups USING btree (event_group_id);

CREATE UNIQUE INDEX event_types_pkey ON public.event_types USING btree (event_type_id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (event_id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_role_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (user_id);

CREATE UNIQUE INDEX venue_status_states_pkey ON public.venue_status_states USING btree (venue_status_state_id);

CREATE UNIQUE INDEX venue_status_types_pkey ON public.venue_status_types USING btree (venue_status_type_id);

CREATE UNIQUE INDEX venue_statuses_pkey ON public.venue_statuses USING btree (venue_status_id);

CREATE UNIQUE INDEX venue_types_pkey ON public.venue_types USING btree (venue_types_id);

CREATE UNIQUE INDEX venues_pkey ON public.venues USING btree (venue_id);

alter table "public"."event_groups" add constraint "event_groups_pkey" PRIMARY KEY using index "event_groups_pkey";

alter table "public"."event_types" add constraint "event_types_pkey" PRIMARY KEY using index "event_types_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."venue_status_states" add constraint "venue_status_states_pkey" PRIMARY KEY using index "venue_status_states_pkey";

alter table "public"."venue_status_types" add constraint "venue_status_types_pkey" PRIMARY KEY using index "venue_status_types_pkey";

alter table "public"."venue_statuses" add constraint "venue_statuses_pkey" PRIMARY KEY using index "venue_statuses_pkey";

alter table "public"."venue_types" add constraint "venue_types_pkey" PRIMARY KEY using index "venue_types_pkey";

alter table "public"."venues" add constraint "venues_pkey" PRIMARY KEY using index "venues_pkey";

alter table "public"."event_groups" add constraint "event_groups_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE not valid;

alter table "public"."event_groups" validate constraint "event_groups_event_id_fkey";

alter table "public"."event_groups" add constraint "event_groups_event_id_user_id_key" UNIQUE using index "event_groups_event_id_user_id_key";

alter table "public"."event_groups" add constraint "event_groups_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE not valid;

alter table "public"."event_groups" validate constraint "event_groups_user_id_fkey";

alter table "public"."events" add constraint "events_venue_status_id_fkey" FOREIGN KEY (venue_status_id) REFERENCES venue_statuses(venue_status_id) not valid;

alter table "public"."events" validate constraint "events_venue_status_id_fkey";

alter table "public"."users" add constraint "users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_user_id_fkey";

alter table "public"."users" add constraint "users_user_role_id_fkey" FOREIGN KEY (user_role_id) REFERENCES user_roles(user_role_id) not valid;

alter table "public"."users" validate constraint "users_user_role_id_fkey";

alter table "public"."venue_statuses" add constraint "venue_statuses_venue_id_fkey" FOREIGN KEY (venue_id) REFERENCES venues(venue_id) not valid;

alter table "public"."venue_statuses" validate constraint "venue_statuses_venue_id_fkey";

alter table "public"."venue_statuses" add constraint "venue_statuses_venue_status_state_id_fkey" FOREIGN KEY (venue_status_state_id) REFERENCES venue_status_states(venue_status_state_id) not valid;

alter table "public"."venue_statuses" validate constraint "venue_statuses_venue_status_state_id_fkey";

alter table "public"."venue_statuses" add constraint "venue_statuses_venue_status_type_id_fkey" FOREIGN KEY (venue_status_type_id) REFERENCES venue_status_types(venue_status_type_id) not valid;

alter table "public"."venue_statuses" validate constraint "venue_statuses_venue_status_type_id_fkey";

alter table "public"."venues" add constraint "venues_venue_types_id_fkey" FOREIGN KEY (venue_types_id) REFERENCES venue_types(venue_types_id) not valid;

alter table "public"."venues" validate constraint "venues_venue_types_id_fkey";

grant delete on table "public"."event_groups" to "anon";

grant insert on table "public"."event_groups" to "anon";

grant references on table "public"."event_groups" to "anon";

grant select on table "public"."event_groups" to "anon";

grant trigger on table "public"."event_groups" to "anon";

grant truncate on table "public"."event_groups" to "anon";

grant update on table "public"."event_groups" to "anon";

grant delete on table "public"."event_groups" to "authenticated";

grant insert on table "public"."event_groups" to "authenticated";

grant references on table "public"."event_groups" to "authenticated";

grant select on table "public"."event_groups" to "authenticated";

grant trigger on table "public"."event_groups" to "authenticated";

grant truncate on table "public"."event_groups" to "authenticated";

grant update on table "public"."event_groups" to "authenticated";

grant delete on table "public"."event_groups" to "service_role";

grant insert on table "public"."event_groups" to "service_role";

grant references on table "public"."event_groups" to "service_role";

grant select on table "public"."event_groups" to "service_role";

grant trigger on table "public"."event_groups" to "service_role";

grant truncate on table "public"."event_groups" to "service_role";

grant update on table "public"."event_groups" to "service_role";

grant delete on table "public"."event_types" to "anon";

grant insert on table "public"."event_types" to "anon";

grant references on table "public"."event_types" to "anon";

grant select on table "public"."event_types" to "anon";

grant trigger on table "public"."event_types" to "anon";

grant truncate on table "public"."event_types" to "anon";

grant update on table "public"."event_types" to "anon";

grant delete on table "public"."event_types" to "authenticated";

grant insert on table "public"."event_types" to "authenticated";

grant references on table "public"."event_types" to "authenticated";

grant select on table "public"."event_types" to "authenticated";

grant trigger on table "public"."event_types" to "authenticated";

grant truncate on table "public"."event_types" to "authenticated";

grant update on table "public"."event_types" to "authenticated";

grant delete on table "public"."event_types" to "service_role";

grant insert on table "public"."event_types" to "service_role";

grant references on table "public"."event_types" to "service_role";

grant select on table "public"."event_types" to "service_role";

grant trigger on table "public"."event_types" to "service_role";

grant truncate on table "public"."event_types" to "service_role";

grant update on table "public"."event_types" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."venue_status_states" to "anon";

grant insert on table "public"."venue_status_states" to "anon";

grant references on table "public"."venue_status_states" to "anon";

grant select on table "public"."venue_status_states" to "anon";

grant trigger on table "public"."venue_status_states" to "anon";

grant truncate on table "public"."venue_status_states" to "anon";

grant update on table "public"."venue_status_states" to "anon";

grant delete on table "public"."venue_status_states" to "authenticated";

grant insert on table "public"."venue_status_states" to "authenticated";

grant references on table "public"."venue_status_states" to "authenticated";

grant select on table "public"."venue_status_states" to "authenticated";

grant trigger on table "public"."venue_status_states" to "authenticated";

grant truncate on table "public"."venue_status_states" to "authenticated";

grant update on table "public"."venue_status_states" to "authenticated";

grant delete on table "public"."venue_status_states" to "service_role";

grant insert on table "public"."venue_status_states" to "service_role";

grant references on table "public"."venue_status_states" to "service_role";

grant select on table "public"."venue_status_states" to "service_role";

grant trigger on table "public"."venue_status_states" to "service_role";

grant truncate on table "public"."venue_status_states" to "service_role";

grant update on table "public"."venue_status_states" to "service_role";

grant delete on table "public"."venue_status_types" to "anon";

grant insert on table "public"."venue_status_types" to "anon";

grant references on table "public"."venue_status_types" to "anon";

grant select on table "public"."venue_status_types" to "anon";

grant trigger on table "public"."venue_status_types" to "anon";

grant truncate on table "public"."venue_status_types" to "anon";

grant update on table "public"."venue_status_types" to "anon";

grant delete on table "public"."venue_status_types" to "authenticated";

grant insert on table "public"."venue_status_types" to "authenticated";

grant references on table "public"."venue_status_types" to "authenticated";

grant select on table "public"."venue_status_types" to "authenticated";

grant trigger on table "public"."venue_status_types" to "authenticated";

grant truncate on table "public"."venue_status_types" to "authenticated";

grant update on table "public"."venue_status_types" to "authenticated";

grant delete on table "public"."venue_status_types" to "service_role";

grant insert on table "public"."venue_status_types" to "service_role";

grant references on table "public"."venue_status_types" to "service_role";

grant select on table "public"."venue_status_types" to "service_role";

grant trigger on table "public"."venue_status_types" to "service_role";

grant truncate on table "public"."venue_status_types" to "service_role";

grant update on table "public"."venue_status_types" to "service_role";

grant delete on table "public"."venue_statuses" to "anon";

grant insert on table "public"."venue_statuses" to "anon";

grant references on table "public"."venue_statuses" to "anon";

grant select on table "public"."venue_statuses" to "anon";

grant trigger on table "public"."venue_statuses" to "anon";

grant truncate on table "public"."venue_statuses" to "anon";

grant update on table "public"."venue_statuses" to "anon";

grant delete on table "public"."venue_statuses" to "authenticated";

grant insert on table "public"."venue_statuses" to "authenticated";

grant references on table "public"."venue_statuses" to "authenticated";

grant select on table "public"."venue_statuses" to "authenticated";

grant trigger on table "public"."venue_statuses" to "authenticated";

grant truncate on table "public"."venue_statuses" to "authenticated";

grant update on table "public"."venue_statuses" to "authenticated";

grant delete on table "public"."venue_statuses" to "service_role";

grant insert on table "public"."venue_statuses" to "service_role";

grant references on table "public"."venue_statuses" to "service_role";

grant select on table "public"."venue_statuses" to "service_role";

grant trigger on table "public"."venue_statuses" to "service_role";

grant truncate on table "public"."venue_statuses" to "service_role";

grant update on table "public"."venue_statuses" to "service_role";

grant delete on table "public"."venue_types" to "anon";

grant insert on table "public"."venue_types" to "anon";

grant references on table "public"."venue_types" to "anon";

grant select on table "public"."venue_types" to "anon";

grant trigger on table "public"."venue_types" to "anon";

grant truncate on table "public"."venue_types" to "anon";

grant update on table "public"."venue_types" to "anon";

grant delete on table "public"."venue_types" to "authenticated";

grant insert on table "public"."venue_types" to "authenticated";

grant references on table "public"."venue_types" to "authenticated";

grant select on table "public"."venue_types" to "authenticated";

grant trigger on table "public"."venue_types" to "authenticated";

grant truncate on table "public"."venue_types" to "authenticated";

grant update on table "public"."venue_types" to "authenticated";

grant delete on table "public"."venue_types" to "service_role";

grant insert on table "public"."venue_types" to "service_role";

grant references on table "public"."venue_types" to "service_role";

grant select on table "public"."venue_types" to "service_role";

grant trigger on table "public"."venue_types" to "service_role";

grant truncate on table "public"."venue_types" to "service_role";

grant update on table "public"."venue_types" to "service_role";

grant delete on table "public"."venues" to "anon";

grant insert on table "public"."venues" to "anon";

grant references on table "public"."venues" to "anon";

grant select on table "public"."venues" to "anon";

grant trigger on table "public"."venues" to "anon";

grant truncate on table "public"."venues" to "anon";

grant update on table "public"."venues" to "anon";

grant delete on table "public"."venues" to "authenticated";

grant insert on table "public"."venues" to "authenticated";

grant references on table "public"."venues" to "authenticated";

grant select on table "public"."venues" to "authenticated";

grant trigger on table "public"."venues" to "authenticated";

grant truncate on table "public"."venues" to "authenticated";

grant update on table "public"."venues" to "authenticated";

grant delete on table "public"."venues" to "service_role";

grant insert on table "public"."venues" to "service_role";

grant references on table "public"."venues" to "service_role";

grant select on table "public"."venues" to "service_role";

grant trigger on table "public"."venues" to "service_role";

grant truncate on table "public"."venues" to "service_role";

grant update on table "public"."venues" to "service_role";


