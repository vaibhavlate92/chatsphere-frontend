const EMOJIS = ['😀','😂','😍','😎','🤔','😮','😢','😡','👍','👎','👏','🙏','🔥','❤️','🎉','💯'];

export default function EmojiPicker({ onPick }) {
  return (
    <div className="emoji-pop glass" role="listbox" aria-label="Emoji">
      {EMOJIS.map((e) => <button key={e} type="button" onClick={() => onPick(e)}>{e}</button>)}
    </div>
  );
}
