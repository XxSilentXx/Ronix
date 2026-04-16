import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #4facfe;
  text-align: center;
`;

const LastModified = styled.p`
  font-size: 0.9rem;
  color: #b8c1ec;
  margin-bottom: 2rem;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #4facfe;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
`;

const Rule = styled.div`
  margin-bottom: 2rem;
`;

const RuleTitle = styled.h3`
  font-size: 1.4rem;
  color: #fff;
  margin-bottom: 1rem;
`;

const RuleList = styled.ol`
  padding-left: 1.5rem;
  
  li {
    margin-bottom: 0.8rem;
    line-height: 1.6;
  }
`;

const RuleText = styled.p`
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const EmphasisText = styled.span`
  color: #00f2fe;
  font-weight: 600;
`;

const Rules = () => {
  return (
    <Container>
      <Title>Rules</Title>
      <LastModified>Last modified: June 15, 2024</LastModified>
      
      <Section>
        <Rule>
          <RuleTitle>Platforms & Epic Names</RuleTitle>
          <RuleList>
            <li>If a player's platform or Epic Name is incorrect, the player has 7 minutes from the time a moderator enters the conversation to remedy the problem.</li>
            <li>The game must be restarted if the player resolves the issue by switching accounts or platforms.</li>
            <li>If a player changes their Epic Name on their account, the score remains the same and the game must be restarted.</li>
            <li>Moderators have the option of allowing players to modify their Epic Name early if needed.</li>
          </RuleList>
        </Rule>
        
        <Rule>
          <RuleTitle>Continue to play if you're unsure</RuleTitle>
          <RuleList>
            <li>Even if you think your opponent is breaking the rules, we urge finishing the game!</li>
            <li>Continuing to play a game will never result in a penalty.</li>
            <li>If your report is correct, the match will either be replayed or will end in your favor.</li>
          </RuleList>
        </Rule>
        
        <Rule>
          <RuleTitle>AFK and availability</RuleTitle>
          <RuleList>
            <li>From the start of a match, all members get 15 minutes to prepare in the lobby. During tournaments, this time is reduced to 7 minutes.</li>
            <li>To verify that the opposition team did not join within 15 minutes, chat and/or join log photo evidence will be necessary.</li>
            <li>If any teammates are absent, the match may be played with fewer players.</li>
            <li>Cancellation of the match must be agreed upon by both parties.</li>
            <li>While your opponent is AFK, you can only get one kill against them at a time.</li>
          </RuleList>
        </Rule>
        
        <Rule>
          <RuleTitle>Glitches in the game</RuleTitle>
          <RuleList>
            <li>If a game glitch occurs, the rounds in which the game glitch occurs are not counted.</li>
            <li>Exploits and two-sided game mechanics that are repeatable do not count as game glitches.</li>
            <li>A game crash isn't considered a bug because it's hard to know whether it was caused intentionally or not.</li>
          </RuleList>
        </Rule>
        
        <Rule>
          <RuleTitle>Party rules, Host, Map & Region</RuleTitle>
          <RuleList>
            <li>The game is reset if the match is played in the wrong region.</li>
            <li>Host is team 1 in-game while the opponents switch to Team 2. All points awarded to the incorrect teams stand.</li>
            <li>If the host is incorrect, all completed matches count, and the non-hosting team has the option to quit and request the host after the current round.</li>
            <li>If the map is incorrect, all completed matches are counted, and after the current round, the default recommended map can be picked.</li>
            <li>It's an immediate round loss if you kick your opponent out of the party in the middle of the round.</li>
          </RuleList>
        </Rule>
        
        <Rule>
          <RuleTitle>Observing / Spectating</RuleTitle>
          <RuleList>
            <li>Any rounds with an outside spectator will be reset, and the team that did not invite the spectator will receive a point.</li>
            <li>The lobby should be made as secluded as feasible.</li>
            <li>It's important to note that other players joining the lobby but not spectating will not cause a redo.</li>
          </RuleList>
        </Rule>
        
        <Rule>
          <RuleTitle>Toxicity</RuleTitle>
          <RuleText>
            Use the <EmphasisText>!toxic</EmphasisText> command for more info in the discord server. You are not allowed to be overly toxic, this will result in a ban. However most forms of toxicity are fine, it's up to mods and admins to decide.
          </RuleText>
        </Rule>
        
        <Rule>
          <RuleTitle>Disconnections</RuleTitle>
          <RuleList>
            <li>You cannot respawn in the middle of a round. This is to avoid players preventing siphon being awarded to their opponents.</li>
            <li>If a team member leaves the game after the round has begun, the remaining members must finish the round. That round would be declared a loss if all players left.</li>
            <li>The round does not count if a team member leaves before the round begins, and the game is halted.</li>
            <li>All unavailable players will be unable to play for the remainder of the game if the game is paused for more than 10 minutes.</li>
            <li>Disconnecting due to lag, a player's game crashing, or any other equipment issues, though unpleasant, does not result in a redo because it is hard to show whether or not it was intentional.</li>
          </RuleList>
        </Rule>
        
        <Rule>
          <RuleTitle>Deception</RuleTitle>
          <RuleList>
            <li>Lying to your opponents regarding the rules, expectations, setup, or anything else that has a direct and clear impact on the match is not allowed. Although not advised, deceiving someone about your skill level is allowed.</li>
            <li>The rule is upheld if enforceable and at least one person from each team agrees to an alternative or additional game rule or modification by voice or chat, with evidence.</li>
            <li>Attempting to complete a game or report someone while one is in progress is considered deception.</li>
            <li>You should immediately stop playing if you flag the match as complete or report your opponent. If you leave in the middle of a round and your report is invalid, the opposing side will receive a point, so if you're not sure, finish the match first.</li>
          </RuleList>
        </Rule>
      </Section>
    </Container>
  );
};

export default Rules; 