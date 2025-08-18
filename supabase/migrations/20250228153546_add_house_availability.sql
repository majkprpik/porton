create table if not exists porton.house_availability_types (
    house_availability_type_id serial primary key,
    house_availability_type_name text not null
);

create table if not exists porton.house_availabilities  (
    house_availability_id serial primary key,
    house_id INT NOT NULL REFERENCES porton.houses(house_id),
    house_availability_type_id INT NOT NULL REFERENCES porton.house_availability_types(house_availability_type_id),
    house_availability_start_date TIMESTAMP,
    house_availability_end_date TIMESTAMP
);