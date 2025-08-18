create table if not exists porton.house_types (
    house_type_id serial primary key,
    house_type_number text not null
);

create table if not exists porton.houses (
  house_id serial primary key,
  house_number int not null,
  house_name text not null,
  house_type_id INT NOT NULL REFERENCES porton.house_types(house_type_id)
);