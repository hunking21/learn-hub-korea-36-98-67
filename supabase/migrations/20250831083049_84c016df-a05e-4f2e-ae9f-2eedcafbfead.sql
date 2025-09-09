-- Create the set_request_header function that the RLS policies expect
CREATE OR REPLACE FUNCTION public.set_request_header(key text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function sets a request-scoped variable that can be accessed by current_setting
    -- It's used to pass session tokens to RLS policies
    PERFORM set_config(key, value, true);
END;
$$;