import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'src');

const replacements = [
    // Backgrounds
    { from: /#f5f0e8/gi, to: '#FAF7F2' },
    { from: /#faf7f0/gi, to: '#FAF7F2' },
    { from: /#f5f0e6/gi, to: '#FAF7F2' },
    { from: /#fdf5e0/gi, to: '#FFFFFF' },
    { from: /#fff9ee/gi, to: '#FFFFFF' },
    { from: /#fdfaf5/gi, to: '#FFFFFF' },
    { from: /#fdf9f0/gi, to: '#FFFFFF' },
    { from: /#fdfaf2/gi, to: '#FFFFFF' },

    // Primary Colors
    { from: /#2B2118/gi, to: '#14B8A6' },
    { from: /#3d2c1a/gi, to: '#0F766E' },
    { from: /#996515/gi, to: '#A8832D' },
    { from: /#B8860B/gi, to: '#C6A75E' },
    { from: /#d4a843/gi, to: '#C6A75E' },

    // Gradients
    { from: /linear-gradient\(\s*135deg\s*,\s*#B8860B\s*,\s*#996515\s*\)/gi, to: 'linear-gradient(135deg, #14B8A6, #0F766E)' },
    { from: /linear-gradient\(\s*135deg\s*,\s*#faf7f0\s*0%\s*,\s*#f5f0e6\s*100%\s*\)/gi, to: '#FAF7F2' },
    { from: /linear-gradient\(\s*135deg\s*,\s*#fdf5e0\s*,\s*#fff9ee\s*\)/gi, to: '#FFFFFF' },
    { from: /linear-gradient\(\s*135deg\s*,\s*#1a1200\s*,\s*#2d1f00\s*\)/gi, to: 'linear-gradient(135deg, #14B8A6, #0F766E)' },
    { from: /linear-gradient\(\s*135deg\s*,\s*#faf5e4\s*,\s*#fff9ee\s*\)/gi, to: '#FFFFFF' },

    // Dark texts
    { from: /#1a1200/gi, to: '#1F2937' },
    { from: /#3d2800/gi, to: '#1F2937' },

    // Sub text
    { from: /#6b5d2f/gi, to: '#6B7280' },
    { from: /#9b8c5a/gi, to: '#9CA3AF' },

    // RGBA base specific borders and backgrounds
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.15\s*\)"/gi, to: '"#E5E1DA"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.2\s*\)"/gi, to: '"#E5E1DA"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.25\s*\)"/gi, to: '"#E5E1DA"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.3\s*\)"/gi, to: '"#E5E1DA"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.08\s*\)"/gi, to: '"rgba(229,225,218,0.5)"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.1\s*\)"/gi, to: '"rgba(20,184,166,0.1)"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.05\s*\)"/gi, to: '"rgba(20,184,166,0.05)"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.6\s*\)"/gi, to: '"rgba(255,255,255,0.7)"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.7\s*\)"/gi, to: '"#FFFFFF"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.5\s*\)"/gi, to: '"rgba(255,255,255,0.6)"' },
    { from: /"rgba\(\s*184,\s*134,\s*11,\s*0\.4\s*\)"/gi, to: '"rgba(255,255,255,0.5)"' },
    { from: /"rgba\(\s*212,\s*168,\s*67,\s*0\.55\s*\)"/gi, to: '"rgba(255,255,255,0.6)"' },

    // Exact objects
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.2\s*\)/gi, to: '#E5E1DA' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.15\s*\)/gi, to: '#E5E1DA' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.25\s*\)/gi, to: '#E5E1DA' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.3\s*\)/gi, to: '#E5E1DA' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.08\s*\)/gi, to: 'rgba(229,225,218,0.5)' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.1\s*\)/gi, to: 'rgba(20,184,166,0.1)' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.05\s*\)/gi, to: 'rgba(20,184,166,0.05)' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.6\s*\)/gi, to: 'rgba(255,255,255,0.7)' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.7\s*\)/gi, to: '#FFFFFF' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.5\s*\)/gi, to: 'rgba(255,255,255,0.6)' },
    { from: /rgba\(\s*184,\s*134,\s*11,\s*0\.4\s*\)/gi, to: 'rgba(255,255,255,0.5)' },
    { from: /rgba\(\s*212,\s*168,\s*67,\s*0\.55\s*\)/gi, to: 'rgba(255,255,255,0.6)' },
];

let updatedFiles = 0;

function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            for (const r of replacements) {
                content = content.replace(r.from, r.to);
            }

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated: ' + fullPath);
                updatedFiles++;
            }
        }
    }
}

processDirectory(dir);
console.log('Total files updated: ' + updatedFiles);
