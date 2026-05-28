export const generateSyntheticData = (count = 100) => {
    const data = [];
    const regions = ["North America", "Europe", "Asia-Pacific", "Middle East"];
    
    for (let i = 0; i < count; i++) {
        // Force some accounts to be bots for detection logic
        const isSuspicious = Math.random() > 0.85;
        
        data.push({
            id: `SID-${Math.floor(1000 + Math.random() * 9000)}`,
            username: `node_${Math.floor(Math.random() * 10000)}`,
            posts_per_day: isSuspicious ? Math.floor(40 + Math.random() * 100) : Math.floor(Math.random() * 10),
            followers: isSuspicious ? Math.floor(Math.random() * 200) : Math.floor(Math.random() * 50000),
            following: isSuspicious ? Math.floor(2000 + Math.random() * 3000) : Math.floor(Math.random() * 1000),
            location: regions[Math.floor(Math.random() * regions.length)],
            last_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            sentiment: (Math.random() * 2 - 1).toFixed(2), // -1 to 1
            engagement_rate: (Math.random() * 15).toFixed(2)
        });
    }
    return data;
};