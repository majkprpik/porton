WITH new_type AS (
  INSERT INTO porton.house_types (house_type_name)
  VALUES ('dodatno')
  RETURNING house_type_id
)
INSERT INTO porton.houses (house_number, house_name, house_type_id)
SELECT -1, 'Zgrada', house_type_id FROM new_type
UNION ALL
SELECT -2, 'Parcele', house_type_id FROM new_type;