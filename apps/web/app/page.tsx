import Link from "next/link";
import { PlayingCard, Chips } from "@/components/playing-card";
import { ProgressStrip } from "@/components/progress";
export default function Home() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A LITTLE PRACTICE. A BETTER INSTINCT.</p>
          <h1>
            Take a seat. <span>Think it through.</span>
          </h1>
          <p>
            Two games. One skill: making better decisions with the information
            you have.
          </p>
        </div>
        <span className="edition-label">
          THE PRACTICE ROOM<span>01 / POKER & BLACKJACK</span>
        </span>
      </div>
      <div className="section-heading">
        <h2>Choose your table</h2>
        <span className="quiet">
          No sign-in needed <span className="green-dot" />
        </span>
      </div>
      <div className="table-choices">
        <article className="game-card poker-choice">
          <div className="game-card-top">
            <span className="pill">POKER</span>
            <span>01 ♠</span>
          </div>
          <div className="mini-table poker-mini">
            <span className="mini-seat seat-one">SB</span>
            <span className="mini-seat seat-two">BB</span>
            <span className="mini-seat seat-three">BTN</span>
            <span className="mini-table-label">TEXAS HOLD’EM</span>
            <div className="preview-board">
              <PlayingCard card="As" />
              <PlayingCard card="Qh" />
              <PlayingCard card="7c" />
            </div>
            <Chips value="24 BB" />
            <span className="dealer-chip">D</span>
          </div>
          <div className="game-card-copy">
            <h2>Read the table.</h2>
            <p>
              Hold’em, Omaha, Short Deck and Stud.
              <br />
              Random hands, calculated EV and guided examples.
            </p>
            <div className="game-tags">
              <span>4 poker variants</span>
              <span>Equity-powered coaching</span>
            </div>
            <Link className="button primary" href="/practice/poker">
              Enter poker table <span>↗</span>
            </Link>
          </div>
        </article>
        <article className="game-card blackjack-choice">
          <div className="game-card-top">
            <span className="pill">BLACKJACK</span>
            <span>02 ♣</span>
          </div>
          <div className="mini-table blackjack-mini">
            <span className="mini-table-label">BLACKJACK PAYS 3 TO 2</span>
            <div className="dealer-preview">
              <PlayingCard card="6h" small />
              <PlayingCard small />
            </div>
            <div className="player-preview">
              <PlayingCard card="8s" />
              <PlayingCard card="8d" />
            </div>
            <Chips value="10" />
            <span className="mini-total">16</span>
          </div>
          <div className="game-card-copy">
            <h2>Know your next move.</h2>
            <p>
              Hit, stand, double or split?
              <br />
              Play complete hands with a strategy coach.
            </p>
            <div className="game-tags">
              <span>Configurable rules</span>
              <span>Hi-Lo counting drills</span>
            </div>
            <Link className="button light" href="/practice/blackjack">
              Enter blackjack table <span>↗</span>
            </Link>
          </div>
        </article>
      </div>
      <ProgressStrip />
      <div className="learning-teasers">
        <Link href="/practice/gto" className="lesson-teaser">
          <span className="lesson-symbol">▦</span>
          <div>
            <span className="eyebrow">POKER · GTO LAB</span>
            <h3>Explore push/fold strategy.</h3>
            <p>Calculated frequencies for 169 starting hands.</p>
          </div>
          <span>↗</span>
        </Link>
        <Link href="/practice/counting" className="lesson-teaser">
          <span className="lesson-symbol">±</span>
          <div>
            <span className="eyebrow">BLACKJACK · CARD COUNTING</span>
            <h3>Keep count. Check your reasoning.</h3>
            <p>Flash drills, true counts and a continuous shoe.</p>
          </div>
          <span>↗</span>
        </Link>
      </div>
      <div className="section-heading">
        <h2>Understand the why</h2>
        <Link className="text-link" href="/learn">
          Explore the library ↗
        </Link>
      </div>
      <div className="learning-teasers">
        <Link href="/learn/pot-odds" className="lesson-teaser">
          <span className="lesson-symbol">⅓</span>
          <div>
            <span className="eyebrow">POKER · 5 MIN</span>
            <h3>What is a call really worth?</h3>
            <p>Pot odds, equity and your break-even point.</p>
          </div>
          <span>↗</span>
        </Link>
        <Link href="/learn/blackjack-strategy" className="lesson-teaser">
          <span className="lesson-symbol">A♣</span>
          <div>
            <span className="eyebrow">BLACKJACK · 6 MIN</span>
            <h3>Good decisions. Uncertain outcomes.</h3>
            <p>The mathematics behind basic strategy.</p>
          </div>
          <span>↗</span>
        </Link>
      </div>
      <Link href="/math" className="lab-banner">
        <span className="lab-symbol">ƒ(x)</span>
        <div>
          <h3>Put the numbers on the table.</h3>
          <p>Change the pot. Compare equity. See how expected value changes.</p>
        </div>
        <span className="button secondary">Open math lab ↗</span>
      </Link>
    </>
  );
}
