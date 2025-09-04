# ElectoralSurvey 🗳️

A comprehensive electoral survey application built with React, TypeScript, and Cloudflare Workers for conducting surveys and collecting electoral data with offline capabilities.

## 🌟 Features

- **Real-time Survey Management**: Create, edit, and manage electoral surveys
- **Offline-First Design**: Works seamlessly offline with data synchronization
- **Multi-User Support**: Role-based access for admins, interviewers, and analysts
- **Statistical Analysis**: Built-in statistical calculators and reporting tools
- **Mobile Responsive**: Optimized for tablets and mobile devices
- **PWA Ready**: Installable as a Progressive Web App
- **Real-time Dashboards**: Live data visualization and monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Git
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lrdspc/ElectoralSurvey.git
   cd ElectoralSurvey
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV for offline sync
- **Authentication**: JWT-based auth system

### Project Structure

```
src/
├── react-app/          # React frontend application
│   ├── components/     # Reusable UI components
│   ├── pages/         # Application pages/screens
│   ├── contexts/      # React contexts for state
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
├── shared/            # Shared types and utilities
└── worker/            # Cloudflare Workers backend
    ├── auth.ts        # Authentication logic
    ├── index.ts       # Worker entry point
    └── mocha-users-service.ts  # User management
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=your-cloudflare-d1-database-url

# Authentication
JWT_SECRET=your-jwt-secret-key

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# App Settings
VITE_APP_NAME=ElectoralSurvey
VITE_API_URL=http://localhost:8787
```

### Cloudflare Setup

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create D1 Database**
   ```bash
   wrangler d1 create electoral-survey-db
   ```

4. **Update wrangler.jsonc**
   Add your database ID to the configuration file.

## 📱 Usage

### Creating a Survey

1. **Login** as an admin user
2. **Navigate** to "Create Survey" from the dashboard
3. **Configure** survey settings:
   - Title and description
   - Target demographics
   - Question types (multiple choice, text, rating)
4. **Add questions** with validation rules
5. **Publish** the survey for field use

### Conducting Interviews

1. **Login** as an interviewer
2. **Select** an active survey
3. **Enter** respondent information
4. **Complete** the questionnaire
5. **Submit** responses (automatically syncs when online)

### Viewing Reports

1. **Access** the dashboard as an analyst
2. **Select** survey and date range
3. **View** real-time statistics
4. **Export** data as CSV or PDF
5. **Generate** visual reports

## 🔐 User Roles

### Admin
- Create and manage surveys
- Manage user accounts
- View system analytics
- Configure system settings

### Interviewer
- Conduct surveys in the field
- View assigned surveys
- Submit responses
- Work offline

### Analyst
- View survey results
- Generate reports
- Export data
- Create custom analyses

## 🔄 Offline Functionality

The application works seamlessly offline:

- **Data Storage**: Local storage for surveys and responses
- **Sync Strategy**: Automatic sync when connection restored
- **Conflict Resolution**: Smart merging of conflicting data
- **Offline Indicators**: Visual feedback for connection status

## 🧪 Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## 🚀 Deployment

### Deploy to Cloudflare Workers

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   npm run deploy
   ```

3. **Access your app**
   The deployment URL will be provided after successful deployment.

### Environment-specific Deployment

```bash
# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
4. **Test your changes**
   ```bash
   npm run test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```

6. **Push and create a Pull Request**

### Commit Convention

We follow [Conventional Commits](https://conventionalcommits.org/):

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Maintenance tasks

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Maintain 80% code coverage

### Pull Request Process

1. **Update documentation** for new features
2. **Add tests** for new functionality
3. **Ensure CI passes** all checks
4. **Request review** from maintainers
5. **Address feedback** promptly

## 📊 Monitoring and Analytics

### Performance Monitoring

- **Core Web Vitals**: Tracked via Cloudflare Analytics
- **Error Tracking**: Sentry integration
- **Performance Budgets**: Bundle size monitoring

### Usage Analytics

- **Survey Metrics**: Response rates, completion times
- **User Activity**: Login patterns, feature usage
- **System Health**: API response times, error rates

## 🔧 Troubleshooting

### Common Issues

#### Development Server Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Database Connection Issues
- Check `.env` file configuration
- Verify Cloudflare D1 database exists
- Check Wrangler authentication

#### Build Failures
```bash
# Clear build cache
npm run clean
npm run build
```

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discord**: Join our [community Discord](https://discord.gg/shDEGBSe2d)
- **Documentation**: Check the [wiki](https://github.com/lrdspc/ElectoralSurvey/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cloudflare**: For the excellent Workers platform
- **React Team**: For the amazing React framework
- **Contributors**: To all who have contributed to this project

## 📞 Support

For support and questions:

- **Email**: support@electoral-survey.com
- **Discord**: [Join our server](https://discord.gg/shDEGBSe2d)
- **GitHub Issues**: [Create an issue](https://github.com/lrdspc/ElectoralSurvey/issues)

---

**Made with ❤️ by the ElectoralSurvey team**
