import sgMail from '@sendgrid/mail';
import { ParticipantWithRSVP, EventWithRSVP } from '../rsvp/types';

export class EmailService {
  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set in environment variables');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendRSVPInvite(
    participant: ParticipantWithRSVP,
    event: EventWithRSVP,
    rsvpToken: string
  ) {
    if (!participant.email) {
      throw new Error('Participant email is required');
    }

    const rsvpUrl = `${process.env.NEXT_PUBLIC_APP_URL}/rsvp/${rsvpToken}`;
    
    const msg = {
      to: participant.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
      subject: `You're invited to ${event.name}!`,
      html: this.generateRSVPEmailTemplate(participant, event, rsvpUrl),
      text: this.generateRSVPEmailTextTemplate(participant, event, rsvpUrl),
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Error sending RSVP email:', error);
      throw error;
    }
  }

  private generateRSVPEmailTemplate(
    participant: ParticipantWithRSVP,
    event: EventWithRSVP,
    rsvpUrl: string
  ): string {
    const participantName = `${participant.first_name} ${participant.last_name}`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited to ${event.name}!</h2>
        <p>Dear ${participantName},</p>
        <p>You have been invited to ${event.name}.</p>
        <p><strong>Event Details:</strong></p>
        <ul>
          <li>Date: ${new Date(event.start_date).toLocaleDateString()}</li>
          <li>Time: ${new Date(event.start_date).toLocaleTimeString()}</li>
          <li>Location: ${event.location || 'TBD'}</li>
        </ul>
        <p>Please click the button below to RSVP:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${rsvpUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            RSVP Now
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p>${rsvpUrl}</p>
        <p>We look forward to seeing you!</p>
      </div>
    `;
  }

  private generateRSVPEmailTextTemplate(
    participant: ParticipantWithRSVP,
    event: EventWithRSVP,
    rsvpUrl: string
  ): string {
    const participantName = `${participant.first_name} ${participant.last_name}`;
    return `
      You're Invited to ${event.name}!

      Dear ${participantName},

      You have been invited to ${event.name}.

      Event Details:
      - Date: ${new Date(event.start_date).toLocaleDateString()}
      - Time: ${new Date(event.start_date).toLocaleTimeString()}
      - Location: ${event.location || 'TBD'}

      Please RSVP by visiting this link:
      ${rsvpUrl}

      We look forward to seeing you!
    `;
  }
} 