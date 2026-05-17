CREATE POLICY "Users can cancel their own subscription purchases"
  ON square_purchase FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND product_kind = 'subscription'
    AND status = 'completed'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND product_kind = 'subscription'
    AND status = 'cancelled'
  );
