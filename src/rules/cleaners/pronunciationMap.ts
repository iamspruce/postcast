import { TransformRule } from "../engine/ruleTypes";
import { CleanContext } from "../types";

/**
 * Rule: pronunciationMap
 * Applies custom pronunciation substitutions.
 * Why: improves TTS clarity for acronyms and brand names.
 * Config: none
 */
export const pronunciationMap = (): TransformRule<CleanContext> => ({
  id: "pronunciationMap",
  description: "Maps special terms to speakable variants",
  async run(input) {
    let text = input.cleanText;
    const mappings: Array<[RegExp, string]> = [
      [/\bAI\b/g, "A I"],
      [/\bGPU\b/g, "G P U"],
      [/\bVRAM\b/gi, "V RAM"],
      [/\bNvidia\b/gi, "En-vid-ia"],
      [/\bCUDA\b/gi, "Coo-da"],
      [/\bTPU\b/gi, "T P U"],
      [/\bRTX\b/gi, "R T X"],
      [/\bH100\b/g, "H 100"],
      [/\bA100\b/g, "A 100"],
      [/\bCPU\b/g, "C P U"],
      [/\bAPI\b/g, "A P I"],
      [/\bUI\b/g, "U I"],
      [/\bUX\b/g, "U X"],
      [/\bML\b/g, "M L"],
      [/\bLLM\b/g, "L L M"],
      [/\bSQL\b/g, "sequel"],
      [/\bNoSQL\b/g, "No sequel"],
      [/\bPostgreSQL\b/g, "Postgres"],
      [/\bMySQL\b/g, "My sequel"],
      [/\bJavaScript\b/g, "Java script"],
      [/\bTypeScript\b/g, "Type script"],
      [/\bJSON\b/g, "JAY-son"],
      [/\bURL\b/g, "U R L"],
      [/\bURI\b/g, "U R I"],
      [/\bSDK\b/g, "S D K"],
      [/\bIDE\b/g, "I D E"],
      [/\bCLI\b/g, "C L I"],
      [/\bGUI\b/g, "gooey"],
      [/\bAWS\b/g, "A W S"],
      [/\bGCP\b/g, "G C P"],
      [/\bNPM\b/g, "N P M"],
      [/\bPNPM\b/g, "P N P M"],
      [/\bK8s\b/g, "Kubernetes"],
      [/\bS3\b/g, "S 3"],
      [/\bEC2\b/g, "E C 2"],
      [/\bJSX\b/g, "J S X"],
      [/\bTSX\b/g, "T S X"],
      [/\bCSS\b/g, "C S S"],
      [/\bHTML\b/g, "H T M L"],
      [/\bHTTP\b/g, "H T T P"],
      [/\bHTTPS\b/g, "H T T P S"],
      [/\bSSL\b/g, "S S L"],
      [/\bTLS\b/g, "T L S"],
      [/\bSSH\b/g, "S S H"],
      [/\bVercel\b/g, "Ver-sell"],
      [/\bNetlify\b/g, "Net-li-fy"],
      [/\bSupabase\b/g, "Supa base"],
      [/\bFirebase\b/g, "Fire base"],
      [/\bPyTorch\b/g, "Pie Torch"],
      [/\bTensorFlow\b/g, "Tensor Flow"],
      [/\bSaaS\b/g, "Sass"],
      [/\bPaaS\b/g, "Pass"],
      [/\bIaaS\b/g, "I A A S"],
      [/\bSVG\b/gi, "S V G"],
      [/\bRGB\b/gi, "R G B"],
      [/\bRGBA\b/gi, "R G B A"],
      [/\bHSL\b/gi, "H S L"],
      [/\bHSLA\b/gi, "H S L A"],
      [/\bHWB\b/gi, "H W B"],
      [/\bLCH\b/gi, "L C H"],
      [/\bOKLCH\b/gi, "O K L C H"],
      [/\bOKLAB\b/gi, "O K Lab"],
      [/\bCIELAB\b/gi, "C I E Lab"],
      [/\bsRGB\b/gi, "S R G B"],
      [/\bDOM\b/g, "D O M"],
      [/\bviewBox\b/g, "view box"],
    ];

    for (const [pattern, replacement] of mappings) {
      text = text.replace(pattern, replacement);
    }

    return {
      ok: true,
      data: {
        ...input,
        cleanText: text,
      },
    };
  },
});
