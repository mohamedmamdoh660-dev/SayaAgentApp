--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: user_roles; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_roles AS ENUM (
    'ADMIN',
    'AGENCY',
    'AGENT',
    '"SUB AGENT"'
);


--
-- Name: create_document_checklist_for_application(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_document_checklist_for_application() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Insert all required documents for this application
  INSERT INTO document_checklist_items (application_id, requirement_id, status)
  SELECT NEW.id, id, 'pending'
  FROM document_requirements
  WHERE active = true
  AND required = true
  AND (program_specific = false OR program_specific = true) -- Include all for now
  AND (university_specific = false OR university_specific = true);
  
  RETURN NEW;
END;
$$;


--
-- Name: execute_query(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.execute_query(query_text text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$DECLARE
    result jsonb;
    rec record;
    results jsonb[] := '{}';
BEGIN
    -- For SELECT queries, we need to handle them differently
    IF UPPER(TRIM(query_text)) LIKE 'SELECT%' THEN
        -- Build JSON array from SELECT results
        FOR rec IN EXECUTE query_text LOOP
            results := results || to_jsonb(rec);
        END LOOP;
        RETURN to_jsonb(results);
    ELSE
        -- For non-SELECT queries (INSERT, UPDATE, DELETE, etc.)
        EXECUTE query_text;
        RETURN '{"success": true}'::jsonb;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error executing query: %', SQLERRM;
        RETURN jsonb_build_object('error', SQLERRM);
END;$$;


--
-- Name: get_admin_dashboard_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_dashboard_stats() RETURNS jsonb
    LANGUAGE plpgsql
    AS $$declare
    total_students int;
    paid_students int;
    total_applications int;
    today_students int;
    week_students int;
    today_applications int;
    week_applications int;
    completed_applications int;
    success_rate numeric;
begin
    -- Total students
    select count(*) into total_students from zoho_students;

    -- Paid students (assuming status = 'active' means paid)
    select count(*) into paid_students 
    from zoho_applications 
    where stage = 'Paid';

    -- Total applications
    select count(*) into total_applications from zoho_applications;

    -- Today start
    -- date_trunc ensures midnight in UTC
    select count(*) into today_students 
    from zoho_students 
    where created_at >= date_trunc('day', now());

    select count(*) into today_applications 
    from zoho_applications 
    where created_at >= date_trunc('day', now());

    -- This week start (Sunday or Monday depending on config; we’ll assume Sunday)
    select count(*) into week_students 
    from zoho_students 
    where created_at >= date_trunc('week', now());

    select count(*) into week_applications 
    from zoho_applications 
    where created_at >= date_trunc('week', now());

    -- Completed applications
    select count(*) into completed_applications
    from zoho_applications
    where stage = 'Complete';

    -- Success rate
    if total_applications > 0 then
        success_rate := (completed_applications::numeric / total_applications::numeric) * 100;
    else
        success_rate := 0;
    end if;

    -- Return everything as JSON
    return jsonb_build_object(
        'totalStudents', coalesce(total_students, 0),
        'paidStudents', coalesce(paid_students,0),
        'totalApplications', coalesce(total_applications, 0),
        'todayStudents', coalesce(today_students, 0),
        'weekStudents', coalesce(week_students, 0),
        'todayApplications', coalesce(today_applications, 0),
        'weekApplications', coalesce(week_applications, 0),
        'successRate', coalesce(success_rate, 0)
    );
end;$$;


--
-- Name: get_application_funnel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_application_funnel() RETURNS json
    LANGUAGE plpgsql
    AS $$
declare
  result json;
begin
  with counts as (
    select 
      coalesce(stage, 'Unknown') as stage,
      count(*)::numeric as value
    from zoho_applications
    group by coalesce(stage, 'Unknown')
  ),
  total as (
    select sum(value) as total_value from counts
  )
  select json_agg(
    json_build_object(
      'name', initcap(replace(stage, '_', ' ')),
      'value', c.value,
      'percentage', 
        case when t.total_value > 0 
          then round((c.value / t.total_value) * 100) 
          else 0 
        end
    )
    order by c.value desc
  )
  into result
  from counts c, total t;

  return coalesce(result, '[]'::json);
end;
$$;


--
-- Name: get_application_timeline(integer, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_application_timeline(p_days integer DEFAULT 30, p_user_id uuid DEFAULT NULL::uuid, p_role text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql
    AS $$declare
  start_date date := current_date - (p_days - 1);
  end_date date := current_date;
  result json;
begin
  -- Step 1: Filter data based on role and date range
  with filtered as (
    select
      date(created_at) as day,
      lower(trim(stage)) as stage
    from zoho_applications
    where created_at::date between start_date and end_date
      and  (
        (p_role = 'agent' and agency_id = p_user_id)
        or (p_role = 'admin')
        or (p_role <> 'agent' and p_role <> 'admin' and user_id = p_user_id)
      )
  ),

  -- Step 2: Count per day per stage
  daily_counts as (
    select
      day,
      stage,
      count(*) as count
    from filtered
    group by day, stage
  ),

  -- Step 3: Generate full date series for all days
  date_series as (
    select generate_series(start_date, end_date, interval '1 day')::date as day
  ),

  -- Step 4: Collect all unique stages
  stages as (
    select distinct stage from filtered where stage is not null
  ),

  -- Step 5: Build the final JSON structure
  json_data as (
    select json_agg(
      json_build_object(
        'date', ds.day,
        'stages', coalesce(
          (
            select json_object_agg(s.stage, coalesce(dc.count, 0))
            from stages s
            left join daily_counts dc
              on dc.day = ds.day and dc.stage = s.stage
          ), '{}'
        )
      ) order by ds.day
    ) as timeline
    from date_series ds
  )
  
  select json_build_object('get_application_timeline', json_data.timeline)
  into result
  from json_data;

  return result;
end;$$;


--
-- Name: get_dashboard_stats(text, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_stats(p_role text, p_agency_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$declare
  result json;
begin
  with students as (
    select 
      count(*) filter (where true) as total_students,
      count(*) filter (where s.created_at::date = current_date) as today_students,
      count(*) filter (where date_trunc('week', s.created_at) = date_trunc('week', current_date)) as this_week_students
    from zoho_students s
    where 
      (
        (p_role = 'agent' and agency_id = p_user_id)
        or (p_role = 'admin')
        or (p_role <> 'agent' and p_role <> 'admin' and user_id = p_user_id)
      )
  ),
  applications as (
    select
      count(*) as total_applications,
      count(*) filter (where a.stage = 'Complete') as completed_applications,
      count(*) filter (where a.created_at::date = current_date) as today_applications,
      count(*) filter (where date_trunc('week', a.created_at) = date_trunc('week', current_date)) as this_week_applications
    from zoho_applications a
    where 
      (p_role = 'admin')
      or (p_role = 'agency' and a.agency_id = p_agency_id)
      or (p_role = 'agent' and a.user_id = p_user_id) 
  ),
  metrics as (
    select 
      a.total_applications,
      s.total_students,
      a.today_applications,
      a.this_week_applications,
      s.today_students,
      s.this_week_students
    from students s, applications a
  )
  select json_build_object(
    'totalApplications', m.total_applications,
    'totalStudents', m.total_students,
    'todayApplications', m.today_applications,
    'thisWeekApplications', m.this_week_applications,
    'todayStudents', m.today_students,
    'thisWeekStudents', m.this_week_students
  )
  into result
  from metrics m;

  return result;
end;$$;


--
-- Name: get_programs_pagination(text, integer, integer, text, text, text, text, text, text, text, integer, integer, boolean, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_programs_pagination(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0, p_university_id text DEFAULT NULL::text, p_faculty_id text DEFAULT NULL::text, p_speciality_id text DEFAULT NULL::text, p_degree_id text DEFAULT NULL::text, p_country_id text DEFAULT NULL::text, p_city_id text DEFAULT NULL::text, p_language_id text DEFAULT NULL::text, p_min_tuition integer DEFAULT NULL::integer, p_max_tuition integer DEFAULT NULL::integer, p_active_applications boolean DEFAULT true, p_sort_by text DEFAULT 'created_at'::text, p_sort_order text DEFAULT 'desc'::text) RETURNS TABLE(id text, name text, official_tuition text, discounted_tuition text, official_tuition_int integer, tuition_currency text, active boolean, active_applications boolean, tuition_fee_usd numeric, university_id text, faculty_id text, speciality_id text, degree_id text, country_id text, city_id text, language_id text, created_at timestamp with time zone, updated_at timestamp with time zone, total_count bigint, country_name text, country_code text, degree_name text, faculty_name text, language_name text, speciality_name text, city_name text, university_name text, university_sector text, university_logo text)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_total_count BIGINT;
BEGIN
  -- Get total count first (only active programs + active universities)
  SELECT COUNT(*) INTO v_total_count
  FROM zoho_programs zp
  LEFT JOIN zoho_universities zu ON zp.university_id = zu.id
  WHERE 
    (p_search IS NULL OR p_search = '%%' OR zp.name ILIKE '%' || NULLIF(p_search, '%%') || '%')
    AND (p_university_id IS NULL OR zp.university_id = p_university_id)
    AND (p_faculty_id IS NULL OR zp.faculty_id = p_faculty_id)
    AND (p_speciality_id IS NULL OR zp.speciality_id = p_speciality_id)
    AND (p_degree_id IS NULL OR zp.degree_id = p_degree_id)
    AND (p_country_id IS NULL OR zp.country_id = p_country_id)
    AND (p_city_id IS NULL OR zp.city_id = p_city_id)
    AND (p_language_id IS NULL OR zp.language_id = p_language_id)
    AND (p_min_tuition IS NULL OR zp.official_tuition::integer >= p_min_tuition)
    AND (p_max_tuition IS NULL OR zp.official_tuition::integer <= p_max_tuition)
    AND (p_active_applications IS NULL OR zp.active_applications = p_active_applications)
    AND zp.active = TRUE
    AND zu.active = TRUE;

  -- Return paginated results with joins
  RETURN QUERY
  SELECT 
    zp.id,
    zp.name,
    zp.official_tuition,
    zp.discounted_tuition,
    zp.official_tuition::integer AS official_tuition_int,
    zp.tuition_currency,
    zp.active,
    zp.active_applications,
    zp.tuition_fee_usd,
    zp.university_id,
    zp.faculty_id,
    zp.speciality_id,
    zp.degree_id,
    zp.country_id,
    zp.city_id,
    zp.language_id,
    zp.created_at,
    zp.updated_at,
    v_total_count AS total_count,
    -- Joined data
    zc.name AS country_name,
    zc.country_code,
    zd.name AS degree_name,
    zf.name AS faculty_name,
    zl.name AS language_name,
    zs.name AS speciality_name,
    zci.name AS city_name,
    zu.name AS university_name,
    zu.sector AS university_sector,
    zu.logo AS university_logo
  FROM zoho_programs zp
  LEFT JOIN zoho_countries zc ON zp.country_id = zc.id
  LEFT JOIN zoho_degrees zd ON zp.degree_id = zd.id
  LEFT JOIN zoho_faculty zf ON zp.faculty_id = zf.id
  LEFT JOIN zoho_languages zl ON zp.language_id = zl.id
  LEFT JOIN zoho_speciality zs ON zp.speciality_id = zs.id
  LEFT JOIN zoho_cities zci ON zp.city_id = zci.id
  LEFT JOIN zoho_universities zu ON zp.university_id = zu.id
  WHERE 
    (p_search IS NULL OR p_search = '%%' OR zp.name ILIKE '%' || NULLIF(p_search, '%%') || '%')
    AND (p_university_id IS NULL OR zp.university_id = p_university_id)
    AND (p_faculty_id IS NULL OR zp.faculty_id = p_faculty_id)
    AND (p_speciality_id IS NULL OR zp.speciality_id = p_speciality_id)
    AND (p_degree_id IS NULL OR zp.degree_id = p_degree_id)
    AND (p_country_id IS NULL OR zp.country_id = p_country_id)
    AND (p_city_id IS NULL OR zp.city_id = p_city_id)
    AND (p_language_id IS NULL OR zp.language_id = p_language_id)
    AND (p_min_tuition IS NULL OR zp.official_tuition::integer >= p_min_tuition)
    AND (p_max_tuition IS NULL OR zp.official_tuition::integer <= p_max_tuition)
    AND (p_active_applications IS NULL OR zp.active_applications = p_active_applications)
    AND zp.active = TRUE
    AND zu.active = TRUE
  ORDER BY 
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN zp.created_at END ASC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN zp.created_at END DESC,
    CASE WHEN p_sort_by = 'official_tuition' AND p_sort_order = 'asc' THEN zp.official_tuition::integer END ASC,
    CASE WHEN p_sort_by = 'official_tuition' AND p_sort_order = 'desc' THEN zp.official_tuition::integer END DESC,
    CASE WHEN p_sort_by = 'tuition_fee_usd' AND p_sort_order = 'asc' THEN zp.tuition_fee_usd::integer END ASC,
    CASE WHEN p_sort_by = 'tuition_fee_usd' AND p_sort_order = 'desc' THEN zp.tuition_fee_usd::integer END DESC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN zp.name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN zp.name END DESC,
    CASE WHEN p_sort_by = 'active' AND p_sort_order = 'asc' THEN zp.active END ASC,
    CASE WHEN p_sort_by = 'active' AND p_sort_order = 'desc' THEN zp.active END DESC,
    CASE WHEN p_sort_by = 'active_applications' AND p_sort_order = 'asc' THEN zp.active_applications END ASC,
    CASE WHEN p_sort_by = 'active_applications' AND p_sort_order = 'desc' THEN zp.active_applications END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: get_table_count(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_table_count(table_name text, search_filters jsonb DEFAULT '{}'::jsonb) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare
  query text;
  col_name text;
  col_value text;
  conditions text := '';
  result_count integer;
begin
 

  -- 🧠 Build OR conditions dynamically
  for col_name, col_value in
    select t.key, trim(both '"' from t.value::text)
    from jsonb_each(search_filters) as t(key, value)
  loop
    if conditions <> '' then
      conditions := conditions || ' OR ';
    end if;

    -- 👇 Use ILIKE for case-insensitive pattern matching
    conditions := conditions || format('%I ILIKE %L', col_name, '%' || col_value || '%');
  end loop;

  -- 🧱 Build query
  if conditions = '' then
    query := format('SELECT count(*) FROM %I', table_name);
  else
    query := format('SELECT count(*) FROM %I WHERE %s', table_name, conditions);
  end if;

  -- 🏃 Execute it
  execute query into result_count;
  return result_count;
end;
$$;


--
-- Name: get_university_applications(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_university_applications(p_user_id uuid DEFAULT NULL::uuid, p_role text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql
    AS $$declare
  result json;
begin
  with filtered as (
    select 
      a.university::text as university_id,
      u.name as university_name
    from zoho_applications a
    left join zoho_universities u on u.id::text = a.university::text
    where a.university is not null
      and  (
        (p_role = 'agent' and a.agency_id = p_user_id)
        or (p_role = 'admin')
        or (p_role <> 'agent' and p_role <> 'admin' and a.user_id = p_user_id)
      )
  ),

  counts as (
    select 
      university_id,
      coalesce(university_name, concat('University ', university_id)) as university,
      count(*) as applications
    from filtered
    group by university_id, university_name
    order by applications desc
  )

  select json_agg(
    json_build_object(
      'university', c.university,
      'applications', c.applications
    )
  )
  into result
  from counts c;

  return coalesce(result, '[]'::json);
end;$$;


--
-- Name: handle_user_email_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_email_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.email is distinct from old.email then
    update public.user_profile
    set email = new.email
    where id = new.id;
  end if;
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: zoho_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_programs (
    id text NOT NULL,
    name text,
    faculty_id text,
    speciality_id text,
    degree_id text,
    language_id text,
    university_id text,
    city_id text,
    country_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    official_tuition text,
    discounted_tuition text,
    tuition_currency text,
    active boolean DEFAULT false,
    active_applications boolean DEFAULT false,
    study_years text,
    country_name text,
    city_name text,
    university_name text,
    degree_name text,
    speciality_name text,
    language_name text,
    faculty_name text,
    university_sector text,
    user_id uuid,
    agency_id uuid,
    searchable_content text,
    fts tsvector,
    embedding public.vector,
    tuition_fee_usd numeric
);


--
-- Name: hybrid_search_programs(text, public.vector, integer, double precision, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hybrid_search_programs(query_text text, query_embedding public.vector, match_count integer DEFAULT 10, full_text_weight double precision DEFAULT 1, semantic_weight double precision DEFAULT 1, rrf_k integer DEFAULT 50) RETURNS SETOF public.zoho_programs
    LANGUAGE sql
    AS $$
  WITH full_text AS (
    SELECT
      id,
      ROW_NUMBER() OVER(ORDER BY ts_rank_cd(fts, websearch_to_tsquery(query_text)) DESC) as rank_ix
    FROM
      zoho_programs
    WHERE
      fts @@ websearch_to_tsquery(query_text)
      AND active = true
      AND active_applications = true
    ORDER BY rank_ix
    LIMIT LEAST(match_count, 30) * 2
  ),
  semantic AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) as rank_ix
    FROM
      zoho_programs
    WHERE
      embedding IS NOT NULL
      AND active = true
      AND active_applications = true
    ORDER BY rank_ix
    LIMIT LEAST(match_count, 30) * 2
  )
  SELECT
    zoho_programs.*
  FROM
    full_text
    FULL OUTER JOIN semantic ON full_text.id = semantic.id
    JOIN zoho_programs ON COALESCE(full_text.id, semantic.id) = zoho_programs.id
  ORDER BY
    COALESCE(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
    COALESCE(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
    DESC
  LIMIT LEAST(match_count, 30)
$$;


--
-- Name: notify_and_email_on_note_added(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_and_email_on_note_added() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  student_record RECORD;
  notification_id TEXT;
BEGIN
  -- Get student and application details
  SELECT 
    s.user_id,
    s.email,
    s.first_name || ' ' || s.last_name as student_name,
    p.name as program_name,
    u.name as university_name,
    a.id as application_id
  INTO student_record
  FROM zoho_applications a
  LEFT JOIN zoho_students s ON s.id = a.student
  LEFT JOIN zoho_programs p ON p.id = a.program
  LEFT JOIN zoho_universities u ON u.id = a.university
  WHERE a.id = NEW.application_id;

  -- Only proceed if student has user_id and email
  IF student_record.user_id IS NOT NULL AND student_record.email IS NOT NULL THEN
    -- Generate notification ID
    notification_id := gen_random_uuid()::text;
    
    -- Create notification
    INSERT INTO zoho_notifications (
      id,
      created_at,
      title,
      content,
      module_name,
      module_id,
      user_id,
      priority,
      is_read,
      notification_type,
      email_sent,
      metadata
    ) VALUES (
      notification_id,
      NOW(),
      'New Note Added',
      'A new note has been added to your application: ' || COALESCE(LEFT(NEW.content, 100), 'No content'),
      'Applications',
      NEW.application_id,
      student_record.user_id,
      'normal',
      false,
      'new_note',
      false,
      jsonb_build_object(
        'student_email', student_record.email,
        'student_name', student_record.student_name,
        'program_name', COALESCE(student_record.program_name, 'Unknown Program'),
        'university_name', COALESCE(student_record.university_name, 'Unknown University'),
        'application_id', student_record.application_id,
        'note_content', NEW.content,
        'note_author', COALESCE(NEW.user_type, 'Support Team')
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: notify_and_email_on_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_and_email_on_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  student_record RECORD;
  app_details RECORD;
  notification_id TEXT;
BEGIN
  -- Only notify if stage has actually changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- Get student and application details
    SELECT 
      s.user_id,
      s.email,
      s.first_name || ' ' || s.last_name as student_name,
      p.name as program_name,
      u.name as university_name
    INTO student_record
    FROM zoho_students s
    LEFT JOIN zoho_programs p ON p.id = NEW.program
    LEFT JOIN zoho_universities u ON u.id = NEW.university
    WHERE s.id = NEW.student;

    -- Only proceed if student has user_id and email
    IF student_record.user_id IS NOT NULL AND student_record.email IS NOT NULL THEN
      -- Generate notification ID
      notification_id := gen_random_uuid()::text;
      
      -- Create notification
      INSERT INTO zoho_notifications (
        id,
        created_at,
        title,
        content,
        module_name,
        module_id,
        user_id,
        priority,
        is_read,
        notification_type,
        email_sent,
        metadata
      ) VALUES (
        notification_id,
        NOW(),
        'Application Status Updated',
        'Your application status has been updated to: ' || COALESCE(NEW.stage, 'Unknown'),
        'Applications',
        NEW.id,
        student_record.user_id,
        'high',
        false,
        'status_update',
        false,
        jsonb_build_object(
          'student_email', student_record.email,
          'student_name', student_record.student_name,
          'program_name', COALESCE(student_record.program_name, 'Unknown Program'),
          'university_name', COALESCE(student_record.university_name, 'Unknown University'),
          'application_id', NEW.id,
          'status', NEW.stage
        )
      );

      -- Call API to send email (this will be handled by the application)
      -- The application will query for notifications where email_sent = false
      -- and send emails accordingly
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: notify_on_announcement_published(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_on_announcement_published() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  student_record RECORD;
  notification_id TEXT;
BEGIN
  -- Only trigger on new announcements or when published status changes to true
  IF (TG_OP = 'INSERT' AND NEW.active = true) OR 
     (TG_OP = 'UPDATE' AND OLD.active = false AND NEW.active = true) THEN
    
    -- Create notification for ALL students
    FOR student_record IN 
      SELECT user_id, email, first_name || ' ' || last_name as student_name
      FROM zoho_students
      WHERE user_id IS NOT NULL AND email IS NOT NULL
    LOOP
      -- Generate notification ID
      notification_id := gen_random_uuid()::text;
      
      -- Create notification
      INSERT INTO zoho_notifications (
        id,
        created_at,
        title,
        content,
        module_name,
        module_id,
        user_id,
        priority,
        is_read,
        notification_type,
        email_sent,
        metadata
      ) VALUES (
        notification_id,
        NOW(),
        'New Announcement: ' || NEW.title,
        COALESCE(LEFT(NEW.content, 150), 'No content'),
        'Announcements',
        NEW.id,
        student_record.user_id,
        CASE WHEN NEW.type = 'urgent' THEN 'high' ELSE 'normal' END,
        false,
        'announcement',
        false,
        jsonb_build_object(
          'student_email', student_record.email,
          'student_name', student_record.student_name,
          'announcement_title', NEW.title,
          'announcement_content', NEW.content,
          'announcement_type', NEW.type,
          'announcement_date', NEW.published_at::text
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: notify_on_application_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_on_application_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  student_user_id UUID;
BEGIN
  -- Only notify if stage has actually changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- Get the student's user_id
    SELECT user_id INTO student_user_id
    FROM zoho_students
    WHERE id = NEW.student;

    -- Only create notification if student has a user_id
    IF student_user_id IS NOT NULL THEN
      INSERT INTO zoho_notifications (
        id,
        created_at,
        title,
        content,
        module_name,
        module_id,
        user_id,
        priority,
        is_read
      ) VALUES (
        gen_random_uuid()::text,
        NOW(),
        'Application Status Updated',
        'Your application status has been updated to: ' || COALESCE(NEW.stage, 'Unknown'),
        'Applications',
        NEW.id,
        student_user_id,
        'high',
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: notify_on_note_added(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_on_note_added() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  app_record RECORD;
  student_user_id UUID;
BEGIN
  -- Get the application and student info
  SELECT a.id, a.student, s.user_id
  INTO app_record
  FROM zoho_applications a
  LEFT JOIN zoho_students s ON s.id = a.student
  WHERE a.id = NEW.application_id;

  -- Only create notification if student has a user_id
  IF app_record IS NOT NULL AND app_record.user_id IS NOT NULL THEN
    INSERT INTO zoho_notifications (
      id,
      created_at,
      title,
      content,
      module_name,
      module_id,
      user_id,
      priority,
      is_read
    ) VALUES (
      gen_random_uuid()::text,
      NOW(),
      'New Note Added',
      'A new note has been added to your application: ' || COALESCE(LEFT(NEW.note_content, 100), 'No content'),
      'Applications',
      NEW.application_id,
      app_record.user_id,
      'normal',
      false
    );
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: update_assessment_results_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_assessment_results_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_cities_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_cities_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_countries_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_countries_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_email_verifications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_email_verifications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_specialities_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_specialities_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_tuition_fee_usd(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_tuition_fee_usd() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Set tuition_fee_usd based on tuition_currency
  NEW.tuition_fee_usd := CASE
    WHEN NEW.tuition_currency = 'USD' THEN NEW.official_tuition::numeric
    WHEN NEW.tuition_currency = 'GBP' THEN NEW.official_tuition::numeric * 1.32
    WHEN NEW.tuition_currency = 'EUR' THEN NEW.official_tuition::numeric * 1.16
    WHEN NEW.tuition_currency = 'CAD' THEN NEW.official_tuition::numeric * 0.71
    WHEN NEW.tuition_currency = 'AUD' THEN NEW.official_tuition::numeric * 0.65
    WHEN NEW.tuition_currency = 'CNY' THEN NEW.official_tuition::numeric * 0.14
    WHEN NEW.tuition_currency = 'RMB' THEN NEW.official_tuition::numeric * 0.14
    WHEN NEW.tuition_currency = 'TRY' THEN NEW.official_tuition::numeric * 0.024
    WHEN NEW.tuition_currency = 'HKD' THEN NEW.official_tuition::numeric * 0.13
    WHEN NEW.tuition_currency = 'MYR' THEN NEW.official_tuition::numeric * 0.24
    WHEN NEW.tuition_currency = 'NZD' THEN NEW.official_tuition::numeric * 0.57
    WHEN NEW.tuition_currency = 'PLN' THEN NEW.official_tuition::numeric * 0.27
    WHEN NEW.tuition_currency = 'CHF' THEN NEW.official_tuition::numeric * 1.16
    ELSE NEW.official_tuition::numeric
  END;

  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_zoho_programs_searchable_content(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_zoho_programs_searchable_content() RETURNS trigger
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  NEW.searchable_content := concat_ws(' | ',
    'Program: ' || COALESCE(NEW.name, ''),
    'Degree: ' || COALESCE(NEW.degree_name, ''),
    'Speciality: ' || COALESCE(NEW.speciality_name, ''),
    'University: ' || COALESCE(NEW.university_name, ''),
    'Faculty: ' || COALESCE(NEW.faculty_name, ''),
    'Country: ' || COALESCE(NEW.country_name, ''),
    'City: ' || COALESCE(NEW.city_name, ''),
    'Language: ' || COALESCE(NEW.language_name, ''),
    'Sector: ' || COALESCE(NEW.university_sector, ''),
    'Tuition: ' || COALESCE(NEW.official_tuition, '') || ' ' || COALESCE(NEW.tuition_currency, ''),
    'Discounted: ' || COALESCE(NEW.discounted_tuition, '') || ' ' || COALESCE(NEW.tuition_currency, '')
  );
  RETURN NEW;
END;
$$;


--
-- Name: upsert_user_from_crm(bigint, text, boolean, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_user_from_crm(_crm_id bigint, _full_name text, _is_active boolean, _profile text, _email text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$DECLARE
  v_user_id uuid;
  v_password text;
BEGIN
  -- Generate password from email before '@'
  v_password := split_part(_email, '@', 1);

  -- Check if user_profile already exists with same crm_id and email
  SELECT id INTO v_user_id
  FROM public.user_profile
  WHERE crm_id = _crm_id AND email = _email;

  IF v_user_id IS NOT NULL THEN
    -- 🔄 Update existing user_profile
    UPDATE public.user_profile
    SET full_name = _full_name,
        is_active = COALESCE(_is_active, is_active),
        profile = COALESCE(_profile, profile),
        updated_at = now()
    WHERE id = v_user_id;

    RETURN v_user_id;
  ELSE
    -- 🆕 Create new auth user
    INSERT INTO auth.users (email, encrypted_password, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      _email,
      crypt(v_password, gen_salt('bf')), -- bcrypt password
      jsonb_build_object('provider', 'email'),
      jsonb_build_object('full_name', _full_name)
    )
    RETURNING id INTO v_user_id;

    -- 🆕 Create new user_profile linked to auth.users
    INSERT INTO public.user_profile (
      id, email, role_id, first_name, last_name,
      is_active, created_at, updated_at, profile, crm_id, full_name
    )
    VALUES (
      v_user_id, _email, 'c9cd4372-b42e-46d7-92bf-d51dd34cd6f8', -- 🔴 Replace with actual default role_id
      split_part(_full_name, ' ', 1), -- first_name
      split_part(_full_name, ' ', 2), -- last_name (simple split)
      COALESCE(_is_active, true),
      now(), now(),
      _profile, _crm_id, _full_name
    );

    RETURN v_user_id;
  END IF;
END;$$;


--
-- Name: zoho_programs_embedding_input(public.zoho_programs); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.zoho_programs_embedding_input(program public.zoho_programs) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$BEGIN
  RETURN program.searchable_content;
END;$$;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    title text NOT NULL,
    content text NOT NULL,
    type text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    published_at timestamp with time zone,
    expires_at timestamp with time zone,
    target_audience text DEFAULT 'all'::text,
    created_by uuid,
    CONSTRAINT "2200_364040_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_364040_2_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_364040_4_not_null" CHECK ((title IS NOT NULL)),
    CONSTRAINT "2200_364040_5_not_null" CHECK ((content IS NOT NULL)),
    CONSTRAINT "2200_364040_6_not_null" CHECK ((type IS NOT NULL)),
    CONSTRAINT "2200_364040_7_not_null" CHECK ((priority IS NOT NULL)),
    CONSTRAINT "2200_364040_8_not_null" CHECK ((active IS NOT NULL)),
    CONSTRAINT announcements_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT announcements_target_audience_check CHECK ((target_audience = ANY (ARRAY['all'::text, 'students'::text, 'agents'::text]))),
    CONSTRAINT announcements_type_check CHECK ((type = ANY (ARRAY['general'::text, 'deadline'::text, 'scholarship'::text, 'visa'::text, 'important'::text])))
);


--
-- Name: assessment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text NOT NULL,
    assessment_date timestamp with time zone DEFAULT now() NOT NULL,
    riasec_realistic integer NOT NULL,
    riasec_investigative integer NOT NULL,
    riasec_artistic integer NOT NULL,
    riasec_social integer NOT NULL,
    riasec_enterprising integer NOT NULL,
    riasec_conventional integer NOT NULL,
    bigfive_openness integer NOT NULL,
    bigfive_conscientiousness integer NOT NULL,
    bigfive_extraversion integer NOT NULL,
    bigfive_agreeableness integer NOT NULL,
    bigfive_neuroticism integer NOT NULL,
    archetype_name text NOT NULL,
    archetype_icon text NOT NULL,
    top_riasec_codes text[] NOT NULL,
    recommendations jsonb NOT NULL,
    raw_answers jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "2200_366840_10_not_null" CHECK ((bigfive_openness IS NOT NULL)),
    CONSTRAINT "2200_366840_11_not_null" CHECK ((bigfive_conscientiousness IS NOT NULL)),
    CONSTRAINT "2200_366840_12_not_null" CHECK ((bigfive_extraversion IS NOT NULL)),
    CONSTRAINT "2200_366840_13_not_null" CHECK ((bigfive_agreeableness IS NOT NULL)),
    CONSTRAINT "2200_366840_14_not_null" CHECK ((bigfive_neuroticism IS NOT NULL)),
    CONSTRAINT "2200_366840_15_not_null" CHECK ((archetype_name IS NOT NULL)),
    CONSTRAINT "2200_366840_16_not_null" CHECK ((archetype_icon IS NOT NULL)),
    CONSTRAINT "2200_366840_17_not_null" CHECK ((top_riasec_codes IS NOT NULL)),
    CONSTRAINT "2200_366840_18_not_null" CHECK ((recommendations IS NOT NULL)),
    CONSTRAINT "2200_366840_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_366840_20_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_366840_21_not_null" CHECK ((updated_at IS NOT NULL)),
    CONSTRAINT "2200_366840_2_not_null" CHECK ((student_id IS NOT NULL)),
    CONSTRAINT "2200_366840_3_not_null" CHECK ((assessment_date IS NOT NULL)),
    CONSTRAINT "2200_366840_4_not_null" CHECK ((riasec_realistic IS NOT NULL)),
    CONSTRAINT "2200_366840_5_not_null" CHECK ((riasec_investigative IS NOT NULL)),
    CONSTRAINT "2200_366840_6_not_null" CHECK ((riasec_artistic IS NOT NULL)),
    CONSTRAINT "2200_366840_7_not_null" CHECK ((riasec_social IS NOT NULL)),
    CONSTRAINT "2200_366840_8_not_null" CHECK ((riasec_enterprising IS NOT NULL)),
    CONSTRAINT "2200_366840_9_not_null" CHECK ((riasec_conventional IS NOT NULL)),
    CONSTRAINT assessment_results_bigfive_agreeableness_check CHECK (((bigfive_agreeableness >= 0) AND (bigfive_agreeableness <= 100))),
    CONSTRAINT assessment_results_bigfive_conscientiousness_check CHECK (((bigfive_conscientiousness >= 0) AND (bigfive_conscientiousness <= 100))),
    CONSTRAINT assessment_results_bigfive_extraversion_check CHECK (((bigfive_extraversion >= 0) AND (bigfive_extraversion <= 100))),
    CONSTRAINT assessment_results_bigfive_neuroticism_check CHECK (((bigfive_neuroticism >= 0) AND (bigfive_neuroticism <= 100))),
    CONSTRAINT assessment_results_bigfive_openness_check CHECK (((bigfive_openness >= 0) AND (bigfive_openness <= 100))),
    CONSTRAINT assessment_results_riasec_artistic_check CHECK (((riasec_artistic >= 0) AND (riasec_artistic <= 100))),
    CONSTRAINT assessment_results_riasec_conventional_check CHECK (((riasec_conventional >= 0) AND (riasec_conventional <= 100))),
    CONSTRAINT assessment_results_riasec_enterprising_check CHECK (((riasec_enterprising >= 0) AND (riasec_enterprising <= 100))),
    CONSTRAINT assessment_results_riasec_investigative_check CHECK (((riasec_investigative >= 0) AND (riasec_investigative <= 100))),
    CONSTRAINT assessment_results_riasec_realistic_check CHECK (((riasec_realistic >= 0) AND (riasec_realistic <= 100))),
    CONSTRAINT assessment_results_riasec_social_check CHECK (((riasec_social >= 0) AND (riasec_social <= 100)))
);


--
-- Name: cost_of_living; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_of_living (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id text,
    city_id text,
    accommodation_min numeric,
    accommodation_max numeric,
    food_monthly numeric,
    transportation_monthly numeric,
    utilities_monthly numeric,
    internet_monthly numeric,
    health_insurance_monthly numeric,
    entertainment_monthly numeric,
    miscellaneous_monthly numeric,
    currency character varying(3) DEFAULT 'USD'::character varying,
    year integer DEFAULT EXTRACT(year FROM now()),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT "2200_384474_1_not_null" CHECK ((id IS NOT NULL))
);


--
-- Name: count_completed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.count_completed (
    count bigint
);


--
-- Name: document_checklist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_checklist_items (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    application_id text NOT NULL,
    requirement_id text,
    custom_name text,
    status text DEFAULT 'pending'::text NOT NULL,
    uploaded_at timestamp with time zone,
    verified_at timestamp with time zone,
    expiry_date date,
    notes text,
    attachment_id text,
    CONSTRAINT "2200_364573_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_364573_2_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_364573_4_not_null" CHECK ((application_id IS NOT NULL)),
    CONSTRAINT "2200_364573_7_not_null" CHECK ((status IS NOT NULL)),
    CONSTRAINT document_checklist_items_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'uploaded'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: document_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_requirements (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    required boolean DEFAULT true NOT NULL,
    requires_expiry boolean DEFAULT false NOT NULL,
    program_specific boolean DEFAULT false NOT NULL,
    university_specific boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL,
    CONSTRAINT "2200_364558_10_not_null" CHECK ((university_specific IS NOT NULL)),
    CONSTRAINT "2200_364558_11_not_null" CHECK ((active IS NOT NULL)),
    CONSTRAINT "2200_364558_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_364558_2_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_364558_4_not_null" CHECK ((name IS NOT NULL)),
    CONSTRAINT "2200_364558_6_not_null" CHECK ((category IS NOT NULL)),
    CONSTRAINT "2200_364558_7_not_null" CHECK ((required IS NOT NULL)),
    CONSTRAINT "2200_364558_8_not_null" CHECK ((requires_expiry IS NOT NULL)),
    CONSTRAINT "2200_364558_9_not_null" CHECK ((program_specific IS NOT NULL)),
    CONSTRAINT document_requirements_category_check CHECK ((category = ANY (ARRAY['personal'::text, 'academic'::text, 'financial'::text, 'visa'::text, 'other'::text])))
);


--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    otp_code text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified boolean DEFAULT false,
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT "2200_375884_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_375884_2_not_null" CHECK ((email IS NOT NULL)),
    CONSTRAINT "2200_375884_3_not_null" CHECK ((otp_code IS NOT NULL)),
    CONSTRAINT "2200_375884_4_not_null" CHECK ((expires_at IS NOT NULL))
);


--
-- Name: financial_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text,
    goal_name character varying(255) NOT NULL,
    target_amount numeric NOT NULL,
    current_amount numeric DEFAULT 0,
    currency character varying(3) DEFAULT 'USD'::character varying,
    deadline date,
    category character varying(50),
    status character varying(50) DEFAULT 'in_progress'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT "2200_384535_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_384535_3_not_null" CHECK ((goal_name IS NOT NULL)),
    CONSTRAINT "2200_384535_4_not_null" CHECK ((target_amount IS NOT NULL))
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    crm_lead_id text NOT NULL,
    ad_id text,
    ad_name text,
    adset_id text,
    adset_name text,
    campaign_id text,
    campaign_name text,
    lead_source text,
    how_did_you_hear_about_event text,
    salutation text,
    first_name text,
    last_name text,
    email text,
    phone text,
    whatsapp text,
    nationality text,
    passport_no text,
    country_of_residence text,
    city text,
    state text,
    street text,
    zip_code text,
    degree_form text,
    university_form text,
    program_form text,
    degree_lookup text,
    university_lookup text,
    program_lookup text,
    expected_start_date timestamp with time zone,
    agents_lookup text,
    agent_type text,
    agent_country text,
    industry text,
    company text,
    expected_students text,
    lead_status text,
    which_fair_will_you_attend text,
    fair_attended boolean DEFAULT false,
    attendance_status text DEFAULT 'Pending'::text,
    check_in_time timestamp with time zone,
    qr_code_link text,
    lead_owner text,
    created_by text,
    modified_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "Fair_Date" date
);


--
-- Name: migration_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migration_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    migration_name text NOT NULL,
    status text NOT NULL,
    message text,
    executed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "2200_17284_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_17284_2_not_null" CHECK ((migration_name IS NOT NULL)),
    CONSTRAINT "2200_17284_3_not_null" CHECK ((status IS NOT NULL)),
    CONSTRAINT "2200_17284_5_not_null" CHECK ((executed_at IS NOT NULL))
);


--
-- Name: new_user_id; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.new_user_id (
    id uuid
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    token text,
    expires_at timestamp with time zone,
    user_id uuid,
    used_at timestamp with time zone,
    CONSTRAINT "2200_26454_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_26454_2_not_null" CHECK ((created_at IS NOT NULL))
);


--
-- Name: program_comparisons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_comparisons (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    user_id uuid NOT NULL,
    name text NOT NULL,
    program_ids text[] NOT NULL,
    CONSTRAINT "2200_357416_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_357416_2_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_357416_4_not_null" CHECK ((user_id IS NOT NULL)),
    CONSTRAINT "2200_357416_5_not_null" CHECK ((name IS NOT NULL)),
    CONSTRAINT "2200_357416_6_not_null" CHECK ((program_ids IS NOT NULL))
);


--
-- Name: role_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_access (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    role_id uuid NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "2200_17305_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_17305_2_not_null" CHECK ((role_id IS NOT NULL)),
    CONSTRAINT "2200_17305_3_not_null" CHECK ((resource IS NOT NULL)),
    CONSTRAINT "2200_17305_4_not_null" CHECK ((action IS NOT NULL)),
    CONSTRAINT "2200_17305_5_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_17305_6_not_null" CHECK ((updated_at IS NOT NULL))
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "2200_17293_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_17293_2_not_null" CHECK ((name IS NOT NULL)),
    CONSTRAINT "2200_17293_4_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_17293_5_not_null" CHECK ((updated_at IS NOT NULL))
);


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id integer DEFAULT nextval('public.settings_id_seq'::regclass) NOT NULL,
    site_name text,
    site_image text,
    appearance_theme text,
    primary_color text,
    secondary_color text,
    logo_url text,
    favicon_url text,
    site_description text,
    meta_keywords text,
    contact_email text,
    social_links jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_setting text,
    logo_horizontal_url text,
    type public.user_roles DEFAULT 'ADMIN'::public.user_roles,
    agency_id uuid,
    CONSTRAINT "2200_17349_1_not_null" CHECK ((id IS NOT NULL))
);


--
-- Name: student_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text,
    name character varying(255) NOT NULL,
    country_id text,
    city_id text,
    university_id text,
    program_id text,
    tuition_fee numeric,
    scholarship_amount numeric,
    family_support numeric,
    part_time_work numeric,
    loan_amount numeric,
    savings numeric,
    accommodation numeric,
    food numeric,
    transportation numeric,
    utilities numeric,
    health_insurance numeric,
    books_supplies numeric,
    entertainment numeric,
    travel numeric,
    miscellaneous numeric,
    currency character varying(3) DEFAULT 'USD'::character varying,
    duration_months integer DEFAULT 12,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT "2200_384498_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_384498_3_not_null" CHECK ((name IS NOT NULL))
);


--
-- Name: student_visa_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_visa_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id text,
    country_id text,
    visa_type character varying(100),
    application_date date,
    appointment_date timestamp without time zone,
    interview_date timestamp without time zone,
    status character varying(50) DEFAULT 'preparing'::character varying,
    application_number character varying(100),
    tracking_number character varying(100),
    documents_submitted jsonb,
    notes text,
    decision_date date,
    visa_expiry_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT "2200_384453_1_not_null" CHECK ((id IS NOT NULL))
);


--
-- Name: user_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profile (
    id uuid NOT NULL,
    email text NOT NULL,
    role_id uuid NOT NULL,
    first_name text,
    last_name text,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    profile text,
    crm_id text,
    full_name text,
    agency_id uuid,
    CONSTRAINT "2200_17322_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_17322_2_not_null" CHECK ((email IS NOT NULL)),
    CONSTRAINT "2200_17322_3_not_null" CHECK ((role_id IS NOT NULL)),
    CONSTRAINT "2200_17322_8_not_null" CHECK ((created_at IS NOT NULL)),
    CONSTRAINT "2200_17322_9_not_null" CHECK ((updated_at IS NOT NULL))
);


--
-- Name: visa_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visa_requirements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_id text,
    visa_type character varying(100) NOT NULL,
    processing_time character varying(100),
    validity_period character varying(100),
    application_fee numeric,
    currency character varying(3) DEFAULT 'USD'::character varying,
    requirements text[],
    documents_needed text[],
    interview_required boolean DEFAULT false,
    biometrics_required boolean DEFAULT false,
    online_application_url text,
    embassy_info jsonb,
    notes text,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT "2200_384434_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_384434_3_not_null" CHECK ((visa_type IS NOT NULL))
);


--
-- Name: zoho_academic_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_academic_years (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    name text,
    active boolean,
    user_id uuid,
    is_default boolean DEFAULT false,
    CONSTRAINT "2200_31253_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_31253_2_not_null" CHECK ((created_at IS NOT NULL))
);


--
-- Name: zoho_announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_announcements (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    category text,
    description text,
    university text,
    program text,
    updated_at timestamp with time zone,
    CONSTRAINT "2200_44523_1_not_null" CHECK ((id IS NOT NULL)),
    CONSTRAINT "2200_44523_2_not_null" CHECK ((created_at IS NOT NULL))
);


--
-- Name: zoho_application_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_application_notes (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    content text,
    user_type text,
    application_id text,
    title text,
    is_read boolean DEFAULT false
);


--
-- Name: zoho_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_applications (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    student text,
    program text,
    acdamic_year text,
    semester text,
    country text,
    university text,
    stage text,
    degree text,
    user_id uuid,
    agency_id uuid,
    application_name text,
    online_application_id text,
    app_id text,
    agent_crm_id text
);


--
-- Name: zoho_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_attachments (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    module text,
    module_id text
);


--
-- Name: zoho_campus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_campus (
    id text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    address text,
    university text,
    faculty text[]
);


--
-- Name: zoho_cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_cities (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    country text,
    updated_at timestamp with time zone,
    user_id uuid
);


--
-- Name: zoho_countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_countries (
    id text NOT NULL,
    country_code text,
    name text NOT NULL,
    active_on_nationalities boolean DEFAULT false,
    active_on_university boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


--
-- Name: zoho_degrees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_degrees (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    update_at timestamp with time zone,
    name text,
    active boolean,
    code text,
    user_id uuid,
    active_in_university boolean DEFAULT false NOT NULL
);


--
-- Name: zoho_faculty; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_faculty (
    id text NOT NULL,
    name text,
    active boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    update_at timestamp with time zone,
    user_id uuid
);


--
-- Name: zoho_languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_languages (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    name text,
    user_id uuid
);


--
-- Name: zoho_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_notifications (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    title text NOT NULL,
    content text,
    module_name text NOT NULL,
    module_id text NOT NULL,
    user_id uuid,
    priority text DEFAULT 'normal'::text,
    is_read boolean DEFAULT false NOT NULL,
    agency_id uuid,
    email_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    notification_type text DEFAULT 'info'::text,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: zoho_semesters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_semesters (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    name text,
    active boolean,
    is_default boolean DEFAULT false,
    user_id uuid
);


--
-- Name: zoho_speciality; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_speciality (
    id text NOT NULL,
    name text,
    active boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    update_at timestamp with time zone,
    faculty_id text,
    user_id uuid
);


--
-- Name: zoho_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_students (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    first_name text,
    last_name text,
    gender text,
    date_of_birth text,
    nationality text,
    passport_number text,
    passport_issue_date text,
    passport_expiry_date text,
    country_of_residence text,
    email text,
    mobile text,
    father_name text,
    father_mobile text,
    father_job text,
    mother_name text,
    mother_mobile text,
    mother_job text,
    user_id uuid,
    agency_id uuid,
    transfer_student text,
    have_tc text,
    blue_card text,
    tc_number text,
    student_id text,
    address_line_1 text,
    city_district text,
    state_province text,
    postal_code text,
    address_country text,
    education_level text,
    education_level_name text,
    high_school_country text,
    high_school_name text,
    high_school_gpa_percent text,
    bachelor_school_name text,
    bachelor_country text,
    bachelor_gpa_percent text,
    master_school_name text,
    master_country text,
    master_gpa_percent text,
    photo_url text,
    crm_id text,
    documents jsonb,
    creator_type text,
    agent_crm_id text
);


--
-- Name: zoho_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: zoho_universities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoho_universities (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    update_at timestamp without time zone,
    name text,
    sector text,
    acomodation text,
    phone text,
    wesbite text,
    logo text,
    profile_image text,
    address text,
    city text,
    country text,
    year_founded text,
    qs_rank text,
    admission_email text,
    active boolean DEFAULT false,
    active_in_apps boolean DEFAULT false,
    description text,
    user_id uuid,
    logo_file_id text,
    logo_attachment_id text,
    logo_file_name text,
    profile_image_id text,
    profile_image_name text,
    profile_image_attachment_id text
);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: zoho_applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: assessment_results assessment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT assessment_results_pkey PRIMARY KEY (id);


--
-- Name: cost_of_living cost_of_living_city_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_of_living
    ADD CONSTRAINT cost_of_living_city_id_year_key UNIQUE (city_id, year);


--
-- Name: cost_of_living cost_of_living_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_of_living
    ADD CONSTRAINT cost_of_living_pkey PRIMARY KEY (id);


--
-- Name: zoho_countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: document_checklist_items document_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_checklist_items
    ADD CONSTRAINT document_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: document_requirements document_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_requirements
    ADD CONSTRAINT document_requirements_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: financial_goals financial_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_goals
    ADD CONSTRAINT financial_goals_pkey PRIMARY KEY (id);


--
-- Name: leads leads_crm_lead_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_crm_lead_id_key UNIQUE (crm_lead_id);


--
-- Name: leads leads_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_email_key UNIQUE (email);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: migration_logs migration_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migration_logs
    ADD CONSTRAINT migration_logs_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: program_comparisons program_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_comparisons
    ADD CONSTRAINT program_comparisons_pkey PRIMARY KEY (id);


--
-- Name: role_access role_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_access
    ADD CONSTRAINT role_access_pkey PRIMARY KEY (id);


--
-- Name: role_access role_access_role_id_resource_action_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_access
    ADD CONSTRAINT role_access_role_id_resource_action_key UNIQUE (role_id, resource, action);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: student_budgets student_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_budgets
    ADD CONSTRAINT student_budgets_pkey PRIMARY KEY (id);


--
-- Name: student_visa_applications student_visa_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_visa_applications
    ADD CONSTRAINT student_visa_applications_pkey PRIMARY KEY (id);


--
-- Name: user_profile user_profile_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_email_key UNIQUE (email);


--
-- Name: user_profile user_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_pkey PRIMARY KEY (id);


--
-- Name: visa_requirements visa_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visa_requirements
    ADD CONSTRAINT visa_requirements_pkey PRIMARY KEY (id);


--
-- Name: zoho_academic_years zoho_academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_academic_years
    ADD CONSTRAINT zoho_academic_years_pkey PRIMARY KEY (id);


--
-- Name: zoho_announcements zoho_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_announcements
    ADD CONSTRAINT zoho_announcements_pkey PRIMARY KEY (id);


--
-- Name: zoho_application_notes zoho_application_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_application_notes
    ADD CONSTRAINT zoho_application_notes_pkey PRIMARY KEY (id);


--
-- Name: zoho_attachments zoho_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_attachments
    ADD CONSTRAINT zoho_attachments_pkey PRIMARY KEY (id);


--
-- Name: zoho_campus zoho_campus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_campus
    ADD CONSTRAINT zoho_campus_pkey PRIMARY KEY (id);


--
-- Name: zoho_cities zoho_cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_cities
    ADD CONSTRAINT zoho_cities_pkey PRIMARY KEY (id);


--
-- Name: zoho_degrees zoho_degrees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_degrees
    ADD CONSTRAINT zoho_degrees_pkey PRIMARY KEY (id);


--
-- Name: zoho_faculty zoho_faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_faculty
    ADD CONSTRAINT zoho_faculty_pkey PRIMARY KEY (id);


--
-- Name: zoho_languages zoho_languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_languages
    ADD CONSTRAINT zoho_languages_pkey PRIMARY KEY (id);


--
-- Name: zoho_notifications zoho_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_notifications
    ADD CONSTRAINT zoho_notifications_pkey PRIMARY KEY (id);


--
-- Name: zoho_programs zoho_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_pkey PRIMARY KEY (id);


--
-- Name: zoho_semesters zoho_semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_semesters
    ADD CONSTRAINT zoho_semesters_pkey PRIMARY KEY (id);


--
-- Name: zoho_speciality zoho_spaciality_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_speciality
    ADD CONSTRAINT zoho_spaciality_pkey PRIMARY KEY (id);


--
-- Name: zoho_students zoho_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_students
    ADD CONSTRAINT zoho_students_pkey PRIMARY KEY (id);


--
-- Name: zoho_tokens zoho_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_tokens
    ADD CONSTRAINT zoho_tokens_pkey PRIMARY KEY (id);


--
-- Name: zoho_universities zoho_universities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_universities
    ADD CONSTRAINT zoho_universities_pkey PRIMARY KEY (id);


--
-- Name: idx_announcements_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_active ON public.announcements USING btree (active);


--
-- Name: idx_announcements_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_published_at ON public.announcements USING btree (published_at DESC);


--
-- Name: idx_announcements_target_audience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_target_audience ON public.announcements USING btree (target_audience);


--
-- Name: idx_announcements_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_announcements_type ON public.announcements USING btree (type);


--
-- Name: idx_assessment_results_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_date ON public.assessment_results USING btree (assessment_date DESC);


--
-- Name: idx_assessment_results_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_student_id ON public.assessment_results USING btree (student_id);


--
-- Name: idx_assessment_results_student_latest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assessment_results_student_latest ON public.assessment_results USING btree (student_id, assessment_date DESC);


--
-- Name: idx_cost_of_living_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_of_living_city ON public.cost_of_living USING btree (city_id);


--
-- Name: idx_cost_of_living_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_of_living_year ON public.cost_of_living USING btree (year);


--
-- Name: idx_document_checklist_items_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_checklist_items_application ON public.document_checklist_items USING btree (application_id);


--
-- Name: idx_document_checklist_items_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_checklist_items_expiry ON public.document_checklist_items USING btree (expiry_date);


--
-- Name: idx_document_checklist_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_checklist_items_status ON public.document_checklist_items USING btree (status);


--
-- Name: idx_document_requirements_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_requirements_active ON public.document_requirements USING btree (active);


--
-- Name: idx_document_requirements_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_requirements_category ON public.document_requirements USING btree (category);


--
-- Name: idx_email_verifications_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verifications_email ON public.email_verifications USING btree (email);


--
-- Name: idx_email_verifications_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verifications_expires_at ON public.email_verifications USING btree (expires_at);


--
-- Name: idx_email_verifications_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verifications_verified ON public.email_verifications USING btree (verified);


--
-- Name: idx_financial_goals_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_financial_goals_student ON public.financial_goals USING btree (student_id);


--
-- Name: idx_leads_crm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_crm_id ON public.leads USING btree (crm_lead_id);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_password_resets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_resets_user_id ON public.password_resets USING btree (user_id);


--
-- Name: idx_program_comparisons_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_program_comparisons_created_at ON public.program_comparisons USING btree (created_at DESC);


--
-- Name: idx_program_comparisons_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_program_comparisons_user_id ON public.program_comparisons USING btree (user_id);


--
-- Name: idx_student_budgets_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_budgets_student ON public.student_budgets USING btree (student_id);


--
-- Name: idx_student_visa_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_visa_applications_status ON public.student_visa_applications USING btree (status);


--
-- Name: idx_student_visa_applications_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_visa_applications_student ON public.student_visa_applications USING btree (student_id);


--
-- Name: idx_visa_requirements_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visa_requirements_country ON public.visa_requirements USING btree (country_id);


--
-- Name: idx_zoho_notifications_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_notifications_agent_id ON public.zoho_notifications USING btree (user_id);


--
-- Name: idx_zoho_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_notifications_created_at ON public.zoho_notifications USING btree (created_at DESC);


--
-- Name: idx_zoho_notifications_email_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_notifications_email_sent ON public.zoho_notifications USING btree (email_sent);


--
-- Name: idx_zoho_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_notifications_is_read ON public.zoho_notifications USING btree (is_read);


--
-- Name: idx_zoho_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_notifications_type ON public.zoho_notifications USING btree (notification_type);


--
-- Name: idx_zoho_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_notifications_user_id ON public.zoho_notifications USING btree (user_id);


--
-- Name: idx_zoho_tokens_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_tokens_created_at ON public.zoho_tokens USING btree (created_at DESC);


--
-- Name: idx_zoho_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zoho_tokens_expires_at ON public.zoho_tokens USING btree (expires_at);


--
-- Name: zoho_programs_fts_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX zoho_programs_fts_idx ON public.zoho_programs USING gin (fts);


--
-- Name: zoho_programs trg_update_tuition_fee_usd_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_tuition_fee_usd_insert BEFORE INSERT ON public.zoho_programs FOR EACH ROW EXECUTE FUNCTION public.update_tuition_fee_usd();


--
-- Name: zoho_programs trg_update_tuition_fee_usd_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_tuition_fee_usd_update BEFORE UPDATE ON public.zoho_programs FOR EACH ROW EXECUTE FUNCTION public.update_tuition_fee_usd();


--
-- Name: announcements trigger_notify_on_announcement_published; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_on_announcement_published AFTER UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.notify_on_announcement_published();


--
-- Name: announcements trigger_notify_on_announcement_published_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_on_announcement_published_insert AFTER INSERT ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.notify_on_announcement_published();


--
-- Name: zoho_applications trigger_notify_on_application_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_on_application_status_change AFTER UPDATE ON public.zoho_applications FOR EACH ROW EXECUTE FUNCTION public.notify_and_email_on_status_change();


--
-- Name: zoho_application_notes trigger_notify_on_note_added; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_notify_on_note_added AFTER INSERT ON public.zoho_application_notes FOR EACH ROW EXECUTE FUNCTION public.notify_and_email_on_note_added();


--
-- Name: assessment_results trigger_update_assessment_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_assessment_results_updated_at BEFORE UPDATE ON public.assessment_results FOR EACH ROW EXECUTE FUNCTION public.update_assessment_results_updated_at();


--
-- Name: zoho_programs trigger_update_searchable_content_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_searchable_content_insert BEFORE INSERT ON public.zoho_programs FOR EACH ROW EXECUTE FUNCTION public.update_zoho_programs_searchable_content();


--
-- Name: zoho_programs trigger_update_searchable_content_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_searchable_content_update BEFORE UPDATE ON public.zoho_programs FOR EACH ROW EXECUTE FUNCTION public.update_zoho_programs_searchable_content();


--
-- Name: zoho_countries update_countries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.zoho_countries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_verifications update_email_verifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_verifications_updated_at BEFORE UPDATE ON public.email_verifications FOR EACH ROW EXECUTE FUNCTION public.update_email_verifications_updated_at();


--
-- Name: zoho_applications applications_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT applications_country_fkey FOREIGN KEY (country) REFERENCES public.zoho_countries(id) ON DELETE SET NULL;


--
-- Name: zoho_applications applications_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT applications_program_fkey FOREIGN KEY (program) REFERENCES public.zoho_programs(id) ON DELETE SET NULL;


--
-- Name: zoho_applications applications_student_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT applications_student_fkey FOREIGN KEY (student) REFERENCES public.zoho_students(id) ON DELETE SET NULL;


--
-- Name: cost_of_living cost_of_living_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_of_living
    ADD CONSTRAINT cost_of_living_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.zoho_cities(id);


--
-- Name: cost_of_living cost_of_living_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_of_living
    ADD CONSTRAINT cost_of_living_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.zoho_countries(id);


--
-- Name: document_checklist_items document_checklist_items_application_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_checklist_items
    ADD CONSTRAINT document_checklist_items_application_fkey FOREIGN KEY (application_id) REFERENCES public.zoho_applications(id) ON DELETE CASCADE;


--
-- Name: document_checklist_items document_checklist_items_requirement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_checklist_items
    ADD CONSTRAINT document_checklist_items_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.document_requirements(id) ON DELETE CASCADE;


--
-- Name: financial_goals financial_goals_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_goals
    ADD CONSTRAINT financial_goals_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.zoho_students(id);


--
-- Name: assessment_results fk_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results
    ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.zoho_students(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;


--
-- Name: role_access role_access_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_access
    ADD CONSTRAINT role_access_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: settings settings_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.user_profile(id) ON DELETE SET NULL;


--
-- Name: student_budgets student_budgets_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_budgets
    ADD CONSTRAINT student_budgets_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.zoho_cities(id);


--
-- Name: student_budgets student_budgets_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_budgets
    ADD CONSTRAINT student_budgets_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.zoho_countries(id);


--
-- Name: student_budgets student_budgets_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_budgets
    ADD CONSTRAINT student_budgets_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.zoho_programs(id);


--
-- Name: student_budgets student_budgets_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_budgets
    ADD CONSTRAINT student_budgets_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.zoho_students(id);


--
-- Name: student_budgets student_budgets_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_budgets
    ADD CONSTRAINT student_budgets_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.zoho_universities(id);


--
-- Name: student_visa_applications student_visa_applications_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_visa_applications
    ADD CONSTRAINT student_visa_applications_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.zoho_countries(id);


--
-- Name: student_visa_applications student_visa_applications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_visa_applications
    ADD CONSTRAINT student_visa_applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.zoho_students(id);


--
-- Name: user_profile user_profile_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.user_profile(id) ON DELETE SET NULL;


--
-- Name: user_profile user_profile_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: visa_requirements visa_requirements_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visa_requirements
    ADD CONSTRAINT visa_requirements_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.zoho_countries(id);


--
-- Name: zoho_academic_years zoho_academic_years_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_academic_years
    ADD CONSTRAINT zoho_academic_years_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_announcements zoho_announcements_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_announcements
    ADD CONSTRAINT zoho_announcements_program_fkey FOREIGN KEY (program) REFERENCES public.zoho_programs(id) ON DELETE SET NULL;


--
-- Name: zoho_announcements zoho_announcements_university_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_announcements
    ADD CONSTRAINT zoho_announcements_university_fkey FOREIGN KEY (university) REFERENCES public.zoho_universities(id) ON DELETE SET NULL;


--
-- Name: zoho_applications zoho_applications_acdamic_year_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT zoho_applications_acdamic_year_fkey FOREIGN KEY (acdamic_year) REFERENCES public.zoho_academic_years(id) ON DELETE SET NULL;


--
-- Name: zoho_applications zoho_applications_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT zoho_applications_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_applications zoho_applications_degree_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT zoho_applications_degree_fkey FOREIGN KEY (degree) REFERENCES public.zoho_degrees(id) ON DELETE SET NULL;


--
-- Name: zoho_applications zoho_applications_semester_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT zoho_applications_semester_fkey FOREIGN KEY (semester) REFERENCES public.zoho_semesters(id) ON DELETE SET NULL;


--
-- Name: zoho_applications zoho_applications_university_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT zoho_applications_university_fkey FOREIGN KEY (university) REFERENCES public.zoho_universities(id) ON DELETE SET NULL;


--
-- Name: zoho_applications zoho_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_applications
    ADD CONSTRAINT zoho_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_campus zoho_campus_university_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_campus
    ADD CONSTRAINT zoho_campus_university_fkey FOREIGN KEY (university) REFERENCES public.zoho_universities(id);


--
-- Name: zoho_cities zoho_cities_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_cities
    ADD CONSTRAINT zoho_cities_country_fkey FOREIGN KEY (country) REFERENCES public.zoho_countries(id) ON DELETE SET NULL;


--
-- Name: zoho_cities zoho_cities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_cities
    ADD CONSTRAINT zoho_cities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_countries zoho_countries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_countries
    ADD CONSTRAINT zoho_countries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_degrees zoho_degrees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_degrees
    ADD CONSTRAINT zoho_degrees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_faculty zoho_faculty_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_faculty
    ADD CONSTRAINT zoho_faculty_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_languages zoho_languages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_languages
    ADD CONSTRAINT zoho_languages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_notifications zoho_notifications_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_notifications
    ADD CONSTRAINT zoho_notifications_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_notifications zoho_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_notifications
    ADD CONSTRAINT zoho_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_programs zoho_programs_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_programs zoho_programs_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.zoho_cities(id) ON DELETE SET NULL;


--
-- Name: zoho_programs zoho_programs_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.zoho_countries(id) ON DELETE SET NULL;


--
-- Name: zoho_programs zoho_programs_degree_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_degree_id_fkey FOREIGN KEY (degree_id) REFERENCES public.zoho_degrees(id) ON DELETE SET NULL;


--
-- Name: zoho_programs zoho_programs_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.zoho_faculty(id) ON DELETE SET NULL;


--
-- Name: zoho_programs zoho_programs_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.zoho_languages(id) ON DELETE SET NULL;


--
-- Name: zoho_programs zoho_programs_speciality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_speciality_id_fkey FOREIGN KEY (speciality_id) REFERENCES public.zoho_speciality(id) ON DELETE SET NULL;


--
-- Name: zoho_programs zoho_programs_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.zoho_universities(id) ON DELETE SET NULL;


--
-- Name: zoho_programs zoho_programs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_programs
    ADD CONSTRAINT zoho_programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_semesters zoho_semesters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_semesters
    ADD CONSTRAINT zoho_semesters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_speciality zoho_speciality_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_speciality
    ADD CONSTRAINT zoho_speciality_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.zoho_faculty(id);


--
-- Name: zoho_speciality zoho_speciality_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_speciality
    ADD CONSTRAINT zoho_speciality_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_students zoho_students_address_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_students
    ADD CONSTRAINT zoho_students_address_country_fkey FOREIGN KEY (address_country) REFERENCES public.zoho_countries(id) ON DELETE SET NULL;


--
-- Name: zoho_students zoho_students_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_students
    ADD CONSTRAINT zoho_students_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_students zoho_students_education_level_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_students
    ADD CONSTRAINT zoho_students_education_level_fkey FOREIGN KEY (education_level) REFERENCES public.zoho_degrees(id) ON DELETE SET NULL;


--
-- Name: zoho_students zoho_students_nationality_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_students
    ADD CONSTRAINT zoho_students_nationality_fkey FOREIGN KEY (nationality) REFERENCES public.zoho_countries(id) ON DELETE SET NULL;


--
-- Name: zoho_students zoho_students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_students
    ADD CONSTRAINT zoho_students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: zoho_universities zoho_universities_city_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_universities
    ADD CONSTRAINT zoho_universities_city_fkey FOREIGN KEY (city) REFERENCES public.zoho_cities(id) ON DELETE SET NULL;


--
-- Name: zoho_universities zoho_universities_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_universities
    ADD CONSTRAINT zoho_universities_country_fkey FOREIGN KEY (country) REFERENCES public.zoho_countries(id) ON DELETE SET NULL;


--
-- Name: zoho_universities zoho_universities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoho_universities
    ADD CONSTRAINT zoho_universities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: announcements Admins can manage announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage announcements" ON public.announcements USING ((auth.uid() IS NOT NULL));


--
-- Name: document_requirements Admins can manage requirements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage requirements" ON public.document_requirements USING ((auth.uid() IS NOT NULL));


--
-- Name: password_resets Allow All; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow All" ON public.password_resets USING (true);


--
-- Name: role_access Allow All; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow All" ON public.role_access USING (true) WITH CHECK (true);


--
-- Name: roles Allow All; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow All" ON public.roles USING (true) WITH CHECK (true);


--
-- Name: settings Allow All; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow All" ON public.settings USING (true);


--
-- Name: user_profile Allow All; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow All" ON public.user_profile USING (true);


--
-- Name: email_verifications Allow delete expired verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete expired verifications" ON public.email_verifications FOR DELETE USING ((expires_at < (now() - '24:00:00'::interval)));


--
-- Name: email_verifications Allow insert for registration; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for registration" ON public.email_verifications FOR INSERT WITH CHECK (true);


--
-- Name: email_verifications Allow select own verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select own verifications" ON public.email_verifications FOR SELECT USING (true);


--
-- Name: email_verifications Allow update own verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update own verifications" ON public.email_verifications FOR UPDATE USING (true);


--
-- Name: cost_of_living Anyone can view cost of living data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view cost of living data" ON public.cost_of_living FOR SELECT USING (true);


--
-- Name: visa_requirements Anyone can view visa requirements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view visa requirements" ON public.visa_requirements FOR SELECT USING ((active = true));


--
-- Name: document_checklist_items Authenticated users can manage checklist items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage checklist items" ON public.document_checklist_items USING (true);


--
-- Name: document_checklist_items Authenticated users can view checklist items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view checklist items" ON public.document_checklist_items FOR SELECT USING (true);


--
-- Name: announcements Everyone can view active announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active announcements" ON public.announcements FOR SELECT USING (((active = true) AND ((published_at IS NULL) OR (published_at <= now())) AND ((expires_at IS NULL) OR (expires_at >= now()))));


--
-- Name: document_requirements Everyone can view active requirements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active requirements" ON public.document_requirements FOR SELECT USING ((active = true));


--
-- Name: student_budgets Students can delete their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can delete their own budgets" ON public.student_budgets FOR DELETE USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: financial_goals Students can delete their own financial goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can delete their own financial goals" ON public.financial_goals FOR DELETE USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: assessment_results Students can insert own assessment results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert own assessment results" ON public.assessment_results FOR INSERT WITH CHECK ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE ((zoho_students.user_id)::text = (auth.uid())::text))));


--
-- Name: student_budgets Students can insert their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own budgets" ON public.student_budgets FOR INSERT WITH CHECK ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: financial_goals Students can insert their own financial goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own financial goals" ON public.financial_goals FOR INSERT WITH CHECK ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: student_visa_applications Students can insert their own visa applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can insert their own visa applications" ON public.student_visa_applications FOR INSERT WITH CHECK ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: assessment_results Students can update own assessment results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update own assessment results" ON public.assessment_results FOR UPDATE USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE ((zoho_students.user_id)::text = (auth.uid())::text)))) WITH CHECK ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE ((zoho_students.user_id)::text = (auth.uid())::text))));


--
-- Name: student_budgets Students can update their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update their own budgets" ON public.student_budgets FOR UPDATE USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: financial_goals Students can update their own financial goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update their own financial goals" ON public.financial_goals FOR UPDATE USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: student_visa_applications Students can update their own visa applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can update their own visa applications" ON public.student_visa_applications FOR UPDATE USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: assessment_results Students can view own assessment results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own assessment results" ON public.assessment_results FOR SELECT USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE ((zoho_students.user_id)::text = (auth.uid())::text))));


--
-- Name: student_budgets Students can view their own budgets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own budgets" ON public.student_budgets FOR SELECT USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: financial_goals Students can view their own financial goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own financial goals" ON public.financial_goals FOR SELECT USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: student_visa_applications Students can view their own visa applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view their own visa applications" ON public.student_visa_applications FOR SELECT USING ((student_id IN ( SELECT zoho_students.id
   FROM public.zoho_students
  WHERE (zoho_students.email = (auth.jwt() ->> 'email'::text)))));


--
-- Name: program_comparisons Users can delete their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comparisons" ON public.program_comparisons FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: program_comparisons Users can insert their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own comparisons" ON public.program_comparisons FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: program_comparisons Users can update their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comparisons" ON public.program_comparisons FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: program_comparisons Users can view their own comparisons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own comparisons" ON public.program_comparisons FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: assessment_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

--
-- Name: cost_of_living; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cost_of_living ENABLE ROW LEVEL SECURITY;

--
-- Name: document_checklist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: document_requirements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: email_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: password_resets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

--
-- Name: program_comparisons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.program_comparisons ENABLE ROW LEVEL SECURITY;

--
-- Name: role_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_access ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--
-- Name: zoho_applications simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY simple ON public.zoho_applications USING (true);


--
-- Name: zoho_notifications simple; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY simple ON public.zoho_notifications USING (true);


--
-- Name: student_budgets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_budgets ENABLE ROW LEVEL SECURITY;

--
-- Name: student_visa_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_visa_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profile; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

--
-- Name: visa_requirements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.visa_requirements ENABLE ROW LEVEL SECURITY;

--
-- Name: zoho_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zoho_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: zoho_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zoho_notifications ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

