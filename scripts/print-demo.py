"""Build the Last Light paper prototype. Requires reportlab; no model requests."""
import json, re
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Flowable, KeepTogether
root=Path(__file__).resolve().parents[1]
g=json.loads((root/'dist/examples/last-light.json').read_text())
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='CardText',fontName='Helvetica',fontSize=10,leading=14,spaceAfter=8))
styles['BodyText'].fontSize=10;styles['BodyText'].leading=14
styles['Heading1'].fontSize=24;styles['Heading1'].leading=28

def clean(s):
 return s.replace('—','-').replace('–','-').replace('•','-').replace('×','x').replace('’',"'").replace('·',' / ')
def para(s,style='BodyText'):return Paragraph(escape(clean(s)).replace('\n','<br/>'),styles[style])
class Board(Flowable):
 def __init__(self):
  super().__init__();self.width=504;self.height=430
 def draw(self):
  c=self.canv
  for row in range(3):
   for col in range(3):
    x=60+col*128;y=45+(2-row)*128
    c.setFillColor(colors.HexColor('#eef3f5'));c.setStrokeColor(colors.HexColor('#405666'));c.roundRect(x,y,120,120,5,fill=1)
    c.setFillColor(colors.HexColor('#20313b'));c.setFont('Helvetica-Bold',14);c.drawString(x+10,y+98,'ABC'[col]+str(row+1))
    boats={(0,0):'Boat 1 / 3 points',(0,1):'Boat 2 / 2 points',(0,2):'Boat 3 / 1 point',(2,0):'Boat 4 / 1 point',(2,1):'Boat 5 / 2 points',(2,2):'Boat 6 / 3 points'}
    label=boats.get((row,col),{(1,0):'Amber starts here',(1,2):'Violet starts here'}.get((row,col),''))
    c.setFont('Helvetica',9);c.drawCentredString(x+60,y+13,label)
class Tokens(Flowable):
 def __init__(self):
  super().__init__();self.width=504;self.height=280
 def draw(self):
  c=self.canv
  for i,o in enumerate([o for o in g['objects'] if o['type']=='piece']):
   x=16+(i%5)*99;y=150-(i//5)*120
   c.setDash(3,3);c.setStrokeColor(colors.HexColor('#555555'));c.setFillColor(colors.HexColor('#f7f7f7'));c.rect(x,y,84,84,fill=1);c.setDash()
   p=para(o['name'],'CardText');w,h=p.wrap(72,72);p.drawOn(c,x+6,y+70-h)
   c.setFillColor(colors.HexColor(o['color']));c.circle(x+42,y+20,8,fill=1,stroke=0)
story=[para('Last Light','Heading1'),para('2 players / Lighthouse rescue / Tabletop prototype'),Spacer(1,12),Board(),para('Print on US Letter at 100%. Move cutout tokens between edge-adjacent spaces. Keep rescued boats beside your lighthouse and sunk boats below the board. The map is a paper layout derived from the generated game, not a 3D render.'),PageBreak(),para('Tokens & landmarks','Heading1'),para('Cut on dashed lines. Colored markers and text identify both keepers, the six boats, and the two lighthouse reference tokens.'),Spacer(1,12),Tokens(),para('Landmark tokens stand in for the editable 3D lighthouses. Scoring is recorded by keeping rescued boat tokens next to their owner. No additional scoring counters are needed.'),PageBreak(),para('Weather cards','Heading1'),para('Cut out all six cards. Shuffle face down; keep backs indistinguishable.'),Spacer(1,14)]
cards=[o for o in g['objects'] if o['type']=='card']
rows=[]
for i in range(0,len(cards),2):
 rows.append([[para(c['name'],'Heading3'),para(c['text'],'CardText')] for c in cards[i:i+2]])
t=Table(rows,colWidths=[246,246],rowHeights=[177]*3)
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BOX',(0,0),(-1,-1),.7,colors.grey),('INNERGRID',(0,0),(-1,-1),.5,colors.grey),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10)]));story.append(t)
story+=[PageBreak(),para('Rules','Heading1')]
for title,text in g['rules'].items():
 story.append(para(title.title(),'Heading2'))
 for paragraph in text.split('\n\n'):story.extend([para(paragraph),Spacer(1,8)])
def footer(c,doc):
 c.setFont('Helvetica',8);c.setFillColor(colors.grey);c.drawString(54,28,'Board Studio / Last Light / Prototype - human playtesting required');c.drawRightString(558,28,str(doc.page))
SimpleDocTemplate(str(root/'submission/last-light-print-kit.pdf'),pagesize=(612,792),rightMargin=54,leftMargin=54,topMargin=45,bottomMargin=48).build(story,onFirstPage=footer,onLaterPages=footer)
print('Created submission/last-light-print-kit.pdf')
