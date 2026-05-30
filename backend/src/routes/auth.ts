`UPDATE users
       SET password_hash = $1
     WHERE id = (SELECT user_id FROM password_reset_tokens WHERE token = $2 AND used = FALSE) 
     RETURNING id`,
      [await bcrypt.hash(newPassword, 12), token]
    );

    if (row.rows.length === 0) {
      res.status(404).json({ error: 'Invalid or expired token' });
      return;
    }

    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);
    res.json({ success: true });
  } catch (err) {
    console.error('[reset-password]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});