[2024-05-30 20:00 UTC]
# Debugging Logout Redirect Issue (May 2024)

- Issue: Logging out redirected to the wrong host/port (e.g., from 3002 to 3000), causing internal server errors.
- Root Cause: Multiple dev servers were running on different ports, causing session and redirect confusion. No .env or config issues were present.
- Solution: Closed all running server processes on ports 3000 and 3002, then restarted the app on the desired port. This ensured consistent session handling and correct redirects.
- Lesson: Avoid overcomplicating the setup. Always ensure only one dev server is running on the intended port to prevent host/port mismatches. Use relative paths for NextAuth redirects and keep the environment clean. 