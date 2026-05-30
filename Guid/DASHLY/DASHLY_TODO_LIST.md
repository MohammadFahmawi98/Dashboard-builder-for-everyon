- [ ] Task 1.6: Create DASHLY Auth Routes (1 hour)
  - [ ] Generate endpoints with Claude Code
  - [ ] Implement /auth/signup endpoint
  - [ ] Implement /auth/login endpoint
  - [ ] Implement /auth/me endpoint
  - [ ] Implement /auth/profile endpoint
  - [ ] Implement /auth/change-password endpoint

### Implemented using prepared statements:
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = validator.escape(email);
  // Use parameterized query here
  const result = await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [sanitizedEmail, hashedPassword]);
  res.status(201).json({ message: 'User created' });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const sanitizedEmail = validator.escape(email);
  // Use parameterized query here
  const result = await db.query('SELECT * FROM users WHERE email = $1', [sanitizedEmail]);
  if (result.rowCount === 1 && await bcrypt.compare(password, result.rows[0].password)) {
    const token = jwt.sign({ id: result.rows[0].id }, SECRET_KEY);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});