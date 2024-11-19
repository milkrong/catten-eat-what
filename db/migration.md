-- 重置数据库 (仅开发环境使用)
-- drop schema public cascade;
-- create schema public;

-- 启用必要的扩展
create extension if not exists "uuid-ossp";

-- 创建用户档案表
create table public.profiles (
id uuid references auth.users on delete cascade,
username text unique,
avatar_url text,
created_at timestamptz default now(),
updated_at timestamptz default now(),
primary key (id)
);

-- 创建用户偏好表
create table public.preferences (
id uuid references public.profiles(id) on delete cascade,
diet_type text[], -- ['chinese', 'western', 'japanese']
restrictions text[], -- ['vegetarian', 'vegan', 'low_carb']
allergies text[], -- ['peanut', 'seafood']
calories_min integer,
calories_max integer,
max_cooking_time integer,
created_at timestamptz default now(),
updated_at timestamptz default now(),
primary key (id)
);

-- 创建食谱表
create table public.recipes (
id uuid default uuid_generate_v4(),
name text not null,
description text,
ingredients jsonb,
steps jsonb,
calories integer,
cooking_time integer,
nutrition_facts jsonb,
cuisine_type text,
diet_type text[],
image_url text,
created_by uuid references public.profiles(id),
created_at timestamptz default now(),
updated_at timestamptz default now(),
primary key (id)
);

-- 创建收藏表
create table public.favorites (
id uuid default uuid_generate_v4(),
user_id uuid references public.profiles(id) on delete cascade,
recipe_id uuid references public.recipes(id) on delete cascade,
created_at timestamptz default now(),
primary key (id),
unique(user_id, recipe_id)
);

-- 创建膳食计划表
create table public.meal_plans (
id uuid default uuid_generate_v4(),
user_id uuid references public.profiles(id) on delete cascade,
date date not null,
meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
recipe_id uuid references public.recipes(id),
created_at timestamptz default now(),
updated_at timestamptz default now(),
primary key (id)
);

-- 创建索引
create index recipes_cuisine_type_idx on public.recipes(cuisine_type);
create index recipes_cooking_time_idx on public.recipes(cooking_time);
create index meal_plans_date_idx on public.meal_plans(date);
create index meal_plans_user_date_idx on public.meal_plans(user_id, date);

-- 启用 RLS
alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.recipes enable row level security;
alter table public.favorites enable row level security;
alter table public.meal_plans enable row level security;

-- Profiles 表的 RLS 策略
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using ( true );

create policy "Users can insert their own profile"
on public.profiles for insert
with check ( auth.uid() = id );

create policy "Users can update their own profile"
on public.profiles for update
using ( auth.uid() = id );

-- Preferences 表的 RLS 策略
create policy "Users can view their own preferences"
on public.preferences for select
using ( auth.uid() = id );

create policy "Users can insert their own preferences"
on public.preferences for insert
with check ( auth.uid() = id );

create policy "Users can update their own preferences"
on public.preferences for update
using ( auth.uid() = id );

-- Recipes 表的 RLS 策略
create policy "Recipes are viewable by everyone"
on public.recipes for select
using ( true );

create policy "Authenticated users can insert recipes"
on public.recipes for insert
with check ( auth.role() = 'authenticated' );

create policy "Users can update their own recipes"
on public.recipes for update
using ( auth.uid() = created_by );

-- Favorites 表的 RLS 策略
create policy "Users can view their own favorites"
on public.favorites for select
using ( auth.uid() = user_id );

create policy "Users can insert their own favorites"
on public.favorites for insert
with check ( auth.uid() = user_id );

create policy "Users can delete their own favorites"
on public.favorites for delete
using ( auth.uid() = user_id );

-- Meal Plans 表的 RLS 策略
create policy "Users can view their own meal plans"
on public.meal_plans for select
using ( auth.uid() = user_id );

create policy "Users can insert their own meal plans"
on public.meal_plans for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own meal plans"
on public.meal_plans for update
using ( auth.uid() = user_id );

-- 创建存储桶
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true);

-- 设置存储规则
create policy "Image uploads only"
on storage.objects for insert
with check (
bucket_id = 'recipe-images' and
(storage.extension(name) = 'png' or
storage.extension(name) = 'jpg' or
storage.extension(name) = 'jpeg') and
storage.size(name) < 5000000
);

-- 创建触发器函数来自动更新 updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
new.updated_at = now();
return new;
end;

$$
language plpgsql;

-- 为需要自动更新updated_at的表添加触发器
create trigger handle_updated_at
    before update on public.profiles
    for each row
    execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.preferences
    for each row
    execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.recipes
    for each row
    execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.meal_plans
    for each row
    execute procedure public.handle_updated_at();
$$
