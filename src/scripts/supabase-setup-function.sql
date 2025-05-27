-- Function to clean up duplicate carts efficiently
-- Run this SQL in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION clean_duplicate_carts(user_id_param TEXT, cart_id_to_keep TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete all carts for the user except the one we want to keep
  DELETE FROM carts 
  WHERE user_id = user_id_param 
  AND id != cart_id_to_keep;
  
  -- Get the number of rows affected
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Return the number of deleted carts
  RETURN deleted_count;
END;
$$;
