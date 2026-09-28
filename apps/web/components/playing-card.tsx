const suits:Record<string,string>={s:"♠",h:"♥",d:"♦",c:"♣"};
const suitNames:Record<string,string>={s:"spades",h:"hearts",d:"diamonds",c:"clubs"};
export function PlayingCard({card,small=false}:{card?:string;small?:boolean}) {
 if(!card)return <span className={`playing-card card-back ${small?"small":""}`} aria-label="Face-down card"><span>♠</span></span>;
 const rank=card.slice(0,-1).replace("T","10"),suit=card.slice(-1);
 return <span className={`playing-card ${suit==="h"||suit==="d"?"red":""} ${small?"small":""}`} aria-label={`${rank} of ${suitNames[suit]}`}><span className="card-corner">{rank}<span>{suits[suit]}</span></span><span className="card-pip" aria-hidden="true">{suits[suit]}</span><span className="card-corner card-bottom" aria-hidden="true">{rank}<span>{suits[suit]}</span></span></span>;
}
export function Chips({value}:{value?:string}){return <span className="chips" aria-label={value?`${value} chips`:"Practice chips"}><i/><i/><i/>{value&&<b>{value}</b>}</span>}
