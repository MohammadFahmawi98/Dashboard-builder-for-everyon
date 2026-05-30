TIME: 30 min
CLAUDE PROMPT:
"Create simple landing page for DASHLY email collection (Week 1).
Use environment variable for the contact email address instead of hardcoding it.

Include:
- Title: Join the Early Access List
- Description: Be the first to know when DASHLY launches! 
- Form: Email input field with a placeholder 'Enter your email'
- Button: 'Sign Up'
- Success Message: 'Thank you for signing up! We'll keep you updated.'
- Form action URL: '/subscribe' which handles submissions
- Handle submission for adding email to the list, using process.env.CONTACT_EMAIL for backend communication."

ACTION:
1. Implement landing page using provided structure.
2. Ensure environment variables are properly configured for deployment.