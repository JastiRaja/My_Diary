# My Diary - Personal Journal Application

A beautiful, secure, and feature-rich personal diary application built with React, TypeScript, and Tailwind CSS. My Diary provides a modern digital journaling experience with local encryption, multiple user profiles, and an intuitive interface.

## 🌟 Features

### 🔐 Security & Privacy
- **Local Encryption**: All diary entries are encrypted using XOR encryption with user-specific secret codes
- **Multiple User Profiles**: Support for multiple users with separate encrypted storage
- **Security Questions**: Password reset functionality with security questions
- **Local Storage**: All data is stored locally in the browser - no cloud dependencies

### 📝 Journaling Features
- **Date-based Entries**: Create and organize entries by specific dates
- **Page Types**: Choose between ruled and plain page layouts
- **Rich Text Editor**: Clean, distraction-free writing experience
- **Word & Character Count**: Track your writing progress
- **Recent Entries**: Quick access to your latest journal entries

### 🎨 User Interface
- **Modern Design**: Beautiful gradient backgrounds and smooth animations
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy
- **Visual Feedback**: Real-time save indicators and loading states

### 📊 Statistics & Organization
- **Entry Statistics**: View total entries, monthly counts, and active days
- **Date Selection**: Pick any date to view or create entries
- **Entry Preview**: See entry content snippets in the dashboard

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Build Tool**: Vite for fast development and optimized builds
- **Icons**: Lucide React for consistent iconography
- **Storage**: Browser localStorage with custom encryption

### Project Structure
```
src/
├── components/          # React components
│   ├── DiaryDashboard.tsx    # Main dashboard view
│   ├── DiaryEditor.tsx       # Entry editor component
│   ├── LoginScreen.tsx       # Authentication screen
│   └── ProfileSelector.tsx   # User profile selection
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── encryption.ts   # Encryption/decryption logic
│   └── storage.ts      # Local storage management
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

### Key Components

#### App.tsx
The main application component that manages:
- Application state and view modes
- User authentication flow
- Entry creation and editing
- Data persistence

#### SecureStorage
Handles all data storage operations:
- User profile management
- Encrypted entry storage
- Password reset functionality
- Data re-encryption when passwords change

#### Encryption
Simple XOR-based encryption for local data protection:
- User-specific encryption keys
- Base64 encoding for storage
- Error handling for corrupted data

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd My_Diary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to access the application

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## 📖 Usage Guide

### Creating Your First Profile

1. **Launch the application** and you'll see the profile selection screen
2. **Click "Add Profile"** to create a new user profile
3. **Enter your name** and choose a secret code (minimum 4 characters)
4. **Select a security question** and provide an answer for password recovery
5. **Click "Create Profile"** to complete setup

### Writing Your First Entry

1. **Select your profile** from the main screen
2. **Enter your secret code** to access your diary
3. **Choose a date** using the date picker
4. **Click "New Entry"** and select page type (ruled or plain)
5. **Start writing** in the editor
6. **Click "Save Entry"** when finished

### Managing Multiple Entries

- **View recent entries** in the sidebar
- **Click on any entry** to edit it
- **Use the date picker** to navigate to different dates
- **Check statistics** to see your writing progress

### Password Recovery

1. **Click "Forgot Passcode?"** on the login screen
2. **Enter your profile name** to find your account
3. **Answer your security question** correctly
4. **Create a new secret code**
5. **Your entries will be preserved** and re-encrypted with the new code

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting
- **Tailwind CSS** for styling

### Adding New Features

1. **Create new components** in the `src/components/` directory
2. **Add TypeScript types** in `src/types/index.ts`
3. **Update the main App.tsx** to include new functionality
4. **Test thoroughly** before committing changes

## 🔒 Security Considerations

### Encryption Details
- Uses XOR encryption with user-specific keys
- All sensitive data is encrypted before storage
- Encryption keys are derived from user secret codes
- No encryption keys are stored in plain text

### Data Privacy
- All data is stored locally in the browser
- No data is transmitted to external servers
- User profiles and entries are completely private
- Password reset requires security question verification

### Limitations
- This is a client-side application with local storage
- Data is not backed up to the cloud
- Clearing browser data will remove all entries
- Encryption is basic XOR - not suitable for high-security requirements

## 🐛 Troubleshooting

### Common Issues

**"Failed to load entries" error**
- Check if your secret code is correct
- Try logging out and back in
- Clear browser cache if problems persist

**"No profile found" during password reset**
- Ensure you're using the exact name from your profile
- Check for extra spaces in the name field

**Application not loading**
- Verify Node.js version is 16 or higher
- Clear `node_modules` and run `npm install` again
- Check browser console for error messages

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Open an issue on the project repository

---

**My Diary** - Your personal digital journal, secure and beautiful. ✨
