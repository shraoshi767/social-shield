export class AnomalyEngine {
    static scan(user) {
        let riskScore = 0;
        let reasons = [];

        // 1. Check Posting Frequency (Spam Pattern)
        if (user.posts_per_day > 30) {
            riskScore += 40;
            reasons.push("Mass Posting Detected");
        }

        // 2. Follower/Following Ratio (Bot Pattern)
        const ratio = user.following / (user.followers + 1);
        if (ratio > 15) {
            riskScore += 35;
            reasons.push("Inauthentic Follower Ratio");
        }

        // 3. Sentiment Toxicity
        if (parseFloat(user.sentiment) < -0.7) {
            riskScore += 25;
            reasons.push("High Toxicity Content");
        }

        let level = "LOW";
        if (riskScore > 70) level = "CRITICAL";
        else if (riskScore > 35) level = "MODERATE";

        return {
            score: riskScore,
            level: level,
            reasons: reasons
        };
    }
}