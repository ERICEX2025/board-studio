// Beginner affordances layer over the editor; game state stays in board.js.
import './board.js';
const $ = id => document.getElementById(id);
function draftMessage(text) {
  const input = $('chat-input');
  if (input.value.trim() && input.value.trim() !== text && !confirm('Replace the message you are writing with this suggestion?')) return;
  input.value = text;
  input.focus();
  input.scrollIntoView({block:'nearest',behavior:'smooth'});
}
const dialog = document.createElement('dialog');
dialog.id = 'beginner-dialog';
dialog.innerHTML = `<form id="idea-builder"><header><div><span class="eyebrow">START WITH AN IDEA</span><h2>What shall we make?</h2></div><button type="button" data-close aria-label="Close idea builder">✕</button></header><p>Astra can design the board, pieces, and rules. Start with a few preferences; you can change them later.</p><label for="idea-theme">What is your game about?</label><textarea id="idea-theme" required maxlength="1200" placeholder="A cozy island where rival explorers search for lost treasure…" rows="3"></textarea><div class="field-pair"><div><label for="idea-players">Players</label><select id="idea-players"><option>2 players</option><option>2–4 players</option><option>1 player</option><option>Help me decide</option></select></div><div><label for="idea-duration">Play time</label><select id="idea-duration"><option>15–20 minutes</option><option>5–10 minutes</option><option>30–45 minutes</option><option>Help me decide</option></select></div></div><label for="idea-feel">How should it feel?</label><select id="idea-feel"><option>Easy to learn, with interesting choices</option><option>Cooperative: win or lose together</option><option>Competitive and strategic</option><option>Playful and surprising</option></select><label for="idea-look">Visual style</label><select id="idea-look"><option>Colorful miniature world</option><option>Cozy handcrafted tabletop</option><option>Clean, graphic, and easy to read</option><option>Dramatic fantasy adventure</option></select><p class="builder-note">This prepares a message for you to review before sending.</p><button class="primary" type="submit">Prepare my game idea</button></form>`;
document.body.append(dialog);
dialog.querySelector('[data-close]').onclick = () => dialog.close();
$('idea-builder').onsubmit = e => {
  e.preventDefault();
  const theme = $('idea-theme').value.trim();
  if (!theme) { $('idea-theme').focus(); return; }
  dialog.close();
  draftMessage(`Help me create a complete board game about ${theme}.\nPlayers: ${$('idea-players').value}. Play time: ${$('idea-duration').value}.\nExperience: ${$('idea-feel').value}. Visual style: ${$('idea-look').value}.\nI do not know Blender or 3D modeling. Explain choices in plain language. Propose two distinct directions first and help me choose. Then build a cohesive board with distinctive pieces, readable spaces, a consistent color palette, and complete beginner-friendly rules (setup, turns, winning, and ties). Keep the first version manageable and make all necessary components available. State any assumptions and what still needs playtesting.`);
};
$('guided-start').onclick = () => dialog.showModal();
$('write-idea').onclick = () => { $('chat-input').focus(); $('chat-input').scrollIntoView({block:'center',behavior:'smooth'}); };
const exampleButton = $('last-light-example');
$('try-example').onclick = () => {
  if (exampleButton) exampleButton.click();
};
const help = document.createElement('dialog');
help.id = 'studio-help';
help.innerHTML = `<form method="dialog"><header><h2>Your first game, step by step</h2><button aria-label="Close guide">✕</button></header></form><ol><li><b>Describe an idea.</b> Tell Astra the theme, number of players, and how long a game should take. Or use “Help me start.”</li><li><b>Choose a direction.</b> Compare the suggestions, then ask Astra to build the one you like.</li><li><b>Review your draft.</b> Inspect the board and proposed changes. “Apply to game” keeps the draft; Undo can reverse it.</li><li><b>Make it yours.</b> Select a piece and describe the change in chat. Use “Check my board” to ask Astra about readability and composition.</li><li><b>Try, save, and print.</b> Routing and rescue games have guided turns and scoring. Other games use a manual tabletop. Test game runs a bounded diagnostic; completed matches can be reviewed with Astra. Save downloads a game file you can reopen. Print makes a paper prototype.</li></ol><h3>Moving around the board</h3><p>Drag to turn the view. Scroll or pinch to zoom. Click a piece to select it. “From above” gives a flat overview; “Show whole board” brings everything back into view.</p><p class="muted">Your work is not saved automatically. Download your game before closing the page. The download contains the game, not the conversation.</p>`;
document.body.append(help);
$('studio-help-button').onclick = () => help.showModal();
$('perspective').textContent='3D view'; $('top-down').textContent='From above'; $('fit').textContent='Show whole board';
$('save-game').textContent='Save game'; $('save-game').title='Download your game as a file you can reopen';
$('component-toggle').title='Add pieces, browse components, or edit rules';
$('chat-input').placeholder='Tell Astra your idea, or describe what you want to change…';
$('review-view').textContent='Check my board';
$('include-view').parentElement.lastChild.textContent=' Share board image';
$('include-view').title='Include a picture of this board with your message so Astra can see it';
const inspector = $('inspector');
let advancedOpen = false, advancedPartsOpen = false;
function simplifyInspector() {
  if (inspector.dataset.enhanced === 'yes' && inspector.querySelector('.beginner-inspector')) return;
  inspector.dataset.enhanced = 'yes';
  const intro = document.createElement('div'); intro.className='beginner-inspector';
  const placeholder = inspector.querySelector('.inspector-placeholder');
  if (placeholder) {
    placeholder.hidden=true;
    intro.innerHTML='<span class="eyebrow">MAKE IT YOURS</span><h2>Start with words.</h2><p>Describe what you imagine. Astra helps you turn it into a board, pieces, and rules.</p><ol class="next-steps"><li>Choose a game idea</li><li>Review and apply the draft</li><li>Try it, then refine it</li></ol><p class="muted">Already have a board? Click a piece to change it, or ask Astra to improve the whole game.</p><button class="wide" id="inspect-rules">Read game rules</button>';
  } else {
    intro.innerHTML='<p>Describe a change to this component. Astra will show a draft before applying it.</p><button class="wide" id="describe-change">Ask Astra to change this</button>';
    const start = inspector.querySelector('[data-field="x"]')?.closest('.field-pair');
    const end = inspector.querySelector('label[for="prop-text"]');
    if(start && end) {
      const details=document.createElement('details'); details.className='precision-controls'; details.open=advancedOpen;
      details.innerHTML='<summary>Size & position</summary>';
      start.before(details);
      let item=start; while(item && item!==end){const next=item.nextSibling;details.append(item);item=next;}
      details.addEventListener('toggle',()=>{advancedOpen=details.open;});
    }
    const partHeading=[...inspector.querySelectorAll('h3')].find(el=>el.textContent.startsWith('3D PARTS'));
    const finalActions=$('duplicate')?.parentElement;
    if(partHeading && finalActions){
      const details=document.createElement('details');details.className='precision-controls';details.open=advancedPartsOpen;details.innerHTML='<summary>Advanced component editing</summary>';
      details.addEventListener('toggle',()=>{advancedPartsOpen=details.open;});
      partHeading.before(details);let item=partHeading;while(item && item!==finalActions){const next=item.nextSibling;details.append(item);item=next;}
    }
  }
  inspector.prepend(intro);
  $('describe-change')?.addEventListener('click',()=>draftMessage(`I'd like to change the selected component, ${inspector.querySelector('h2')?.textContent || 'this piece'}. Help me choose a visual improvement while keeping the rest of the game unchanged.`));
  $('inspect-rules')?.addEventListener('click',()=> $('edit-rules').click());
}
new MutationObserver(simplifyInspector).observe(inspector,{childList:true});
simplifyInspector();
