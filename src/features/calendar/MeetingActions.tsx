import { useState } from 'react';
import { ExternalLink, Phone, Video } from 'lucide-react';
import { approvedMeetingUrl, type CalendarEvent } from '../../domain/calendar';
import { Dialog } from '../../shared/Dialog';
import { meetingProvider } from './presentation';

export function MeetingActions({ event, sample, prominent = false, compact = false, onNotice }: { event: CalendarEvent; sample: boolean; prominent?: boolean; compact?: boolean; onNotice: (message: string) => void }) {
  const [choosing,setChoosing]=useState(false);
  const urls=[...new Set(event.joinUrls.map(url=>approvedMeetingUrl(url)).filter((url): url is string=>!!url))];
  function launch(url: string) { const approved=approvedMeetingUrl(url); if (approved) window.open(approved,'_blank','noopener,noreferrer'); setChoosing(false); }
  function join() { if(sample) onNotice('Meeting preview only. Connect Outlook to open your meetings.'); else if(urls.length===1) launch(urls[0]); else setChoosing(true); }
  const style=`button ${prominent ? 'primary' : 'subtle'}`;
  const provider=meetingProvider(event) ?? 'meeting';
  return <>
    {compact ? (sample || urls.length>0) && <div className="meeting-call-actions" role="group" aria-label={`Meeting options for ${event.title}`}>
      <button className="meeting-call-button" aria-label={`${sample ? 'Preview' : 'Open'} audio options for ${event.title}`} title={sample ? 'Preview audio options' : `Open ${provider} for audio; choose audio and camera settings in the meeting app`} onClick={join}><Phone size={15} aria-hidden="true" /></button>
      <button className="meeting-call-button" aria-label={`${sample ? 'Preview' : 'Open'} video options for ${event.title}`} title={sample ? 'Preview video options' : `Open ${provider} for video; choose audio and camera settings in the meeting app`} onClick={join}><Video size={16} aria-hidden="true" /></button>
    </div> : sample ? <button className={style} onClick={join}>Preview meeting <ExternalLink size={15} /></button> : urls.length ? <button className={style} onClick={join}>Join meeting <ExternalLink size={15} /></button> : <a className={style} href="https://outlook.office.com/calendar/" target="_blank" rel="noopener noreferrer">Open Outlook <ExternalLink size={15} /></a>}
    {choosing && <Dialog title="Choose meeting link" onClose={()=>setChoosing(false)}><p className="help-text">Choose the intended destination from this invitation.</p>{urls.map((url,index)=><button key={url} className="button subtle meeting-choice" onClick={()=>launch(url)}>Link {index+1} · {new URL(url).hostname}<ExternalLink size={15} /></button>)}</Dialog>}
  </>;
}
