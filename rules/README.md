# Cursor Rules

This directory contains custom rules and instructions for Cursor IDE. These rules are maintained in version control to ensure they persist across Cursor updates and can be easily restored.

## Files

- `cursor.rules`: Contains the main rules for Cursor IDE
- `README.md`: This documentation file

## Usage

1. After a Cursor update, copy the contents of `cursor.rules` to your `.cursorrules` file in your workspace
2. Or, create a symbolic link from `.cursorrules` to `rules/cursor.rules`

## Adding New Rules

1. Edit the `cursor.rules` file
2. Commit your changes
3. Push to your repository

## Backup

These rules are version controlled, so you can always:
- Track changes to your rules
- Restore previous versions if needed
- Share rules across different machines 