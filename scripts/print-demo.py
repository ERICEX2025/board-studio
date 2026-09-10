"""Generate current guided examples as printable kits. Requires reportlab."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
root=Path(__file__).resolve().parents[1]
style=ParagraphStyle('body',fontName='Helvetica',fontSize=11,leading=16,textColor=HexColor('#263137'))
def clean(s):
 for a,b in [('↑','N'),('→','E'),('↓','S'),('←','W'),('×','x'),('—','-'),('–','-'),('’',"'"),('·',' / ')]:s=s.replace(a,b)
 return s
for name in ['gutter-duel','last-light']:
 g=json.loads((root/f'dist/examples/{name}.json').read_text());c=g['runtime'];objects={o['id']:o for o in g['objects']};out=root/f'submission/{name}-print-kit.pdf';pdf=canvas.Canvas(str(out),pagesize=(612,792));pdf.setTitle(g['name']+' - Print and play');page=0
 def text(s,x,y,w=504,size=11):
  sty=ParagraphStyle('local',parent=style,fontSize=size,leading=size*1.45);p=Paragraph(escape(clean(s)).replace('\n','<br/>'),sty);_,h=p.wrap(w,700);p.drawOn(pdf,x,y-h);return y-h
 def start(title,subtitle=''):
  global page
  if page:pdf.showPage()
  page+=1;pdf.setFillColor(HexColor('#263137'));pdf.setFont('Helvetica',9);pdf.drawString(54,749,'BOARD STUDIO / '+g['name'].upper());pdf.setFont('Helvetica-Bold',24);pdf.drawString(54,710,title)
  if subtitle:text(subtitle,54,690,size=10)
  pdf.setFont('Helvetica',8);pdf.setFillColor(HexColor('#657078'));pdf.drawString(54,27,'Print at 100% / Prototype - human playtesting required');pdf.drawRightString(558,27,str(page));pdf.setStrokeColor(HexColor('#40535e'));pdf.setFillColor(HexColor('#263137'))
 def arrow(x,y,d,size=24):
  pdf.saveState();pdf.translate(x,y);pdf.rotate(-90*d);pdf.setLineWidth(3);pdf.line(0,-size/2,0,size/2);pdf.line(0,size/2,-size/3,size/6);pdf.line(0,size/2,size/3,size/6);pdf.restoreState()
 start('Make your game','2 players / '+('Rotate and route' if c['kind']=='routing' else 'Move and rescue'))
 steps=['Print single-sided on US Letter at actual size (100%). Measure the calibration line below. Use opaque paper or cardstock.', 'Keep the board page intact. Cut tokens along dashed edges. Optional: glue to thin card before cutting.', 'Cut the separate gutter tiles. Place each on its numbered cell with the arrow pointing as shown. Set Water and Lock beside the board.' if c['kind']=='routing' else 'Cut weather fronts and matching backs. Glue one identical back to every front, or put fronts into opaque sleeves. Shuffle face down.', 'Place components using the starting-position diagram. Read the quick reference and rules. Play one practice round, then reset scores and pieces.']
 y=652
 for i,s in enumerate(steps):y=text(str(i+1)+'. '+s,54,y)-20
 pdf.setLineWidth(1);pdf.line(54,y-10,126,y-10);text('1 inch / 25.4 mm',54,y-20,size=9)
 y-=90;text('You need: scissors, optional glue/cardstock'+(', pencil and paper for scores and turns.' if c['kind']=='routing' else '. Scores are recorded by keeping rescued boat tokens. No dice are needed.'),54,y)
 text('The 3D landmarks become flat labeled tokens. No 3D printer required. Keep all tokens visible: color is reinforced by names and boat numbers.',54,y-70)
 start('Board & starting positions','North is the top of this page. Directions do not depend on where you sit.')
 size=min(144,432/max(c['rows'],c['columns']));left=306-c['columns']*size/2;top=638
 text('NORTH / '+c['playerNames'][0],left,670,w=432,size=10)
 for i,id in enumerate(c['spaceIds']):
  row,col=divmod(i,c['columns']);x=left+col*size;y=top-(row+1)*size
  pdf.setFillColor(HexColor('#f1f1eb'));pdf.rect(x,y,size,size,fill=1);pdf.setFillColor(HexColor('#263137'));text(str(i+1)+' / '+objects[id]['name'],x+7,y+size-8,size-14,9)
  if c['kind']=='routing':
   arrow(x+size/2,y+size/2,c['directions'][i]);
   if i==c['starts'][0]:text('INLET',x+size/2-17,y+25,60,9)
  else:
   labels=[f"Boat {n+1} / {b['value']} points" for n,b in enumerate(c['boats']) if b['cell']==i]+[c['playerNames'][p]+' starts' for p,cell in enumerate(c['starts']) if cell==i]
   text('\n'.join(labels),x+8,y+size/2,size-16,10)
 bottom=top-c['rows']*size;text('SOUTH / '+c['playerNames'][1],left,bottom-12,432,10)
 text('Grid positions keep their numbers. Rotate tiles in place; the inlet remains at position '+str(c['starts'][0]+1)+'.' if c['kind']=='routing' else 'Movement follows shared edges. Pawns may share cells. Moving onto a boat does not rescue it; rescuing requires a separate action.',54,bottom-45)
 if c['kind']=='routing':
  start('Separate gutter tiles','Cut dashed outlines. Each 1.7-inch tile fits within its 2-inch board cell.')
  for i,d in enumerate(c['directions']):
   x=70+(i%3)*158;y=500-(i//3)*155;pdf.setDash(3,3);pdf.rect(x,y,122.4,122.4);pdf.setDash();text(str(i+1),x+8,y+113,100,10);arrow(x+61,y+61,d,34)
   if i==c['starts'][0]:text('INLET',x+43,y+24,80,9)
 pieces=[o for o in g['objects'] if o['type']=='piece']
 for begin in range(0,len(pieces),12):
  start('Tokens & landmarks','Cut dashed outlines. Names and numbers also work in grayscale.')
  for i,o in enumerate(pieces[begin:begin+12]):
   x=60+(i%3)*164;y=520-(i//3)*142;pdf.setDash(3,3);pdf.rect(x,y,108,108);pdf.setDash();pdf.setFillColor(HexColor(o['color']));pdf.rect(x,y+102,108,6,fill=1,stroke=0);pdf.setFillColor(HexColor('#263137'));text(o['name'],x+8,y+92,92,10)
   for n,b in enumerate(c['boats']):
    if b['id']==o['id']:text(f"Boat {n+1}\n{b['value']} points",x+8,y+45,92,10)
 events=[objects[e['id']] for e in c['events']]
 for begin in range(0,len(events),4):
  for back in [False,True]:
   start('Weather backs' if back else 'Weather fronts','Cut and glue identical backs to fronts; do not duplex automatically.' if back else 'Reveal and resolve weather before either keeper takes an action.')
   for i,o in enumerate(events[begin:begin+4]):
    x=90+(i%2)*240;y=390-(i//2)*285;pdf.setDash(3,3);pdf.rect(x,y,180,252);pdf.setDash()
    text(g['name'] if back else o['name'],x+14,y+225,152,16)
    text('WEATHER\nKeep this side facing up until revealed.' if back else o['text'],x+14,y+170,152,11)
 start('Quick reference','Keep this page beside the table.')
 steps=(['Choose an unlocked gutter.','Rotate exactly 90 degrees left or right. Move Lock onto this tile.','Trace Water from the inlet. Stop at any exit or repeated tile.','North exit: first garden +1. South exit: second garden +1. Side or loop: zero.','Count this turn. After '+str(c['turnLimit'])+' turns, higher points wins. Equal points share victory.'] if c['kind']=='routing' else ['Reveal one weather card. Resolve any sinking immediately.','First keeper: move OR rescue on your cell OR pass.','Other keeper takes one action. Moving never rescues automatically.','Discard the weather. Alternate the first keeper each round.','End when all boats leave the board or the last round finishes. Compare points, then rescued boat counts.'])
 y=650
 for i,s in enumerate(steps):y=text(str(i+1)+'. '+s,54,y)-22
 text('Example sequence',54,y-10,size=16)
 labels=['ROTATE','TRACE','SCORE'] if c['kind']=='routing' else ['WEATHER','MOVE','RESCUE LATER']
 for i,label in enumerate(labels):
  x=54+i*174;pdf.roundRect(x,y-95,146,48,4);text(label,x+12,y-60,130,11)
  if i<2:pdf.line(x+150,y-71,x+168,y-71)
 text('After your first game: swap seats. Record total time, unclear instructions and repetitive choices. Computer diagnostics cannot establish whether the game is fun.',54,y-125)
 start('Rules manual')
 y=665
 for key in ['setup','turns','scoring','victory']:
  p=Paragraph(escape(clean(g['rules'][key])),style);_,h=p.wrap(504,700)
  if y-h-50<65:start('Rules manual / continued');y=665
  text(key.title(),54,y,size=16);y-=30;y=text(g['rules'][key],54,y)-24
 pdf.save();print(str(out))
