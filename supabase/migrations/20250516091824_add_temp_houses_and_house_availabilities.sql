create table if not exists porton.temp_houses (
  house_id serial primary key,
  house_number int not null,
  house_name text not null,
  house_type_id INT NOT NULL REFERENCES porton.house_types(house_type_id)
);

create table if not exists porton.temp_house_availabilities  (
    house_availability_id serial primary key,
    house_id INT NOT NULL REFERENCES porton.temp_houses(house_id),
    house_availability_type_id INT NOT NULL REFERENCES porton.house_availability_types(house_availability_type_id),
    house_availability_start_date TIMESTAMP,
    house_availability_end_date TIMESTAMP
);