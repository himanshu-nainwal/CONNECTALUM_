import React, { useContext } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar/Navbars";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import LoginSignup from "./components/LoginSignup/LoginSignup";
import Student from "./pages/Student/Student";
import Alumini from "./pages/Alumini/Alumini";
import Profile from "./components/Profile/Profile";
import Chat from "./pages/Chat/Chat";
import Messages from "./pages/Messages/Messages";
import Resources from "./pages/Resources/Resources";
import Communities from "./pages/Communities/Communities";
import Connections from "./pages/Connections/Connections";
import ResumeAnalyzer from "./pages/ResumeAnalyzer/ResumeAnalyzer";
import MockInterview from "./pages/MockInterview/MockInterview";
import QnA from "./pages/QnA/QnA";
import Stories from "./pages/Stories/Stories";
import Admin from "./pages/Admin/Admin";
import CareerChatbot from "./components/CareerChatbot/CareerChatbot";
import { StoreContext } from "./context/StoreContext";

const MessagesWrapper = () => {
  const [params] = useSearchParams();
  return <Messages openWithUserId={params.get("userId")} openWithUserName={params.get("userName")} />;
};

const App = () => {
  const { showLogin, setShowLogin } = useContext(StoreContext);
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          },
        }}
      />
      {showLogin && <LoginSignup setShowLogin={setShowLogin} />}
      <Navbar setShowLogin={setShowLogin} />
      <main style={{ minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/student" element={<Student />} />
          <Route path="/alumni" element={<Alumini />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/messages" element={<MessagesWrapper />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/connections" element={<Connections />} />

          {/* New Modules Routes */}
          <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/qna" element={<QnA />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      {/* 24/7 AI Career Guidance Chatbot (Module 7) */}
      <CareerChatbot />

      <Footer />
    </>
  );
};
export default App;
