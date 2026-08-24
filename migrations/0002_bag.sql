create table if not exists bag_items (
  id serial primary key,
  user_id text not null,
  product_id text not null,
  qty integer not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists bag_items_user_id_idx on bag_items (user_id);
