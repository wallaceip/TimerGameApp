# TimeSync

A mobile timing and synchronization application built with React Native and Expo. TimeSync tests precision and reaction time through clock synchronization mechanics and interactive timing challenges.

## Features

- **Precision Timing Mechanics:** Accurate millisecond tracking for reflex and synchronization challenges.
- **Cross-Platform Support:** Native performance across Android, iOS, and Web via Expo.
- **Clean Mobile UI:** Intuitive, touch-friendly interface designed for rapid interaction.
- **Dynamic Feedback:** Real-time scoring, latency/offset calculation, and round results.

## Tech Stack

- **Framework:** React Native
- **Platform:** Expo
- **Language:** JavaScript / TypeScript
- **Styling:** React Native StyleSheet

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (LTS version recommended)
- **npm** or **yarn**
- **Expo Go** app on your physical iOS or Android device (available on Google Play Store and Apple App Store), or a configured iOS Simulator / Android Emulator.

## Getting Started

### 1. Clone the Repository

```bash
git clone [https://github.com/wallaceip/timesync.git](https://github.com/wallaceip/timesync.git)
cd timesync

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Start the Development Server

```bash
npx expo start

```

### 4. Run the Application

Once the Metro bundler starts in your terminal:

* **On a Physical Device:** Scan the displayed QR code using the **Expo Go** app (Android) or the native **Camera** app (iOS).
* **On Android Emulator:** Press `a` in the terminal.
* **On iOS Simulator:** Press `i` in the terminal (macOS required).
* **In Web Browser:** Press `w` in the terminal.

## Project Structure

```text
timesync/
├── assets/          # App icons, splash screens, and static images
├── components/      # Reusable UI elements (timers, buttons, display cards)
├── screens/         # Main application views and game screens
├── App.js           # Root application entry and state setup
├── app.json         # Expo configuration and metadata
├── package.json     # Project dependencies and run scripts
└── README.md        # Documentation

```

## Available Scripts

* `npx expo start` - Start the Expo development server.
* `npx expo start --clear` - Clear Metro bundler cache before starting.
* `npm run android` - Start the project directly on a connected Android device or emulator.
* `npm run ios` - Start the project directly in the iOS simulator.
* `npm run web` - Run the app in a web browser.

## Contributing

Contributions, bug reports, and feature suggestions are welcome:

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add NewFeature'`).
4. Push to your branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.
