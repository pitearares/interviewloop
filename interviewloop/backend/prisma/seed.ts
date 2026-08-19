import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ProblemSeed {
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM";
  topic:
    | "ARRAYS_STRINGS"
    | "ALGORITHMS"
    | "DATA_STRUCTURES"
    | "DYNAMIC_PROGRAMMING"
    | "LANGUAGE_FUNDAMENTALS"
    | "OOP"
    | "COLLECTIONS"
    | "MEMORY_MANAGEMENT";
  kind?: "CODING" | "THEORY";
  track?: "GENERAL" | "JAVA" | "CPP";
  prompt: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
  starterCodeJs?: string;
  starterCodePy?: string;
  starterCodeJava?: string;
  starterCodeCpp?: string;
  testCases: { input: unknown[]; expected: unknown }[];
}

const problems: ProblemSeed[] = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "EASY",
    topic: "ARRAYS_STRINGS",
    prompt:
      "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.",
    constraints:
      "- `2 <= nums.length <= 10^4`\n- `-10^9 <= nums[i] <= 10^9`\n- `-10^9 <= target <= 10^9`\n- Exactly one valid answer exists.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    starterCodeJs: "function twoSum(nums, target) {\n  // your code here\n}\n",
    starterCodePy: "def two_sum(nums, target):\n    # your code here\n    pass\n",
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
    ],
  },
  {
    title: "Valid Anagram",
    slug: "valid-anagram",
    difficulty: "EASY",
    topic: "ARRAYS_STRINGS",
    prompt:
      "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
    constraints:
      "- `1 <= s.length, t.length <= 5 * 10^4`\n- `s` and `t` consist of lowercase English letters.",
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
    ],
    starterCodeJs: "function isAnagram(s, t) {\n  // your code here\n}\n",
    starterCodePy: "def is_anagram(s, t):\n    # your code here\n    pass\n",
    testCases: [
      { input: ["anagram", "nagaram"], expected: true },
      { input: ["rat", "car"], expected: false },
    ],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-buy-sell-stock",
    difficulty: "EASY",
    topic: "ARRAYS_STRINGS",
    prompt:
      "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`.\n\nYou want to maximize your profit by choosing a single day to buy and a different later day to sell. Return the maximum profit you can achieve. If no profit is possible, return `0`.",
    constraints: "- `1 <= prices.length <= 10^5`\n- `0 <= prices[i] <= 10^4`",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price 1), sell on day 5 (price 6)." },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
    starterCodeJs: "function maxProfit(prices) {\n  // your code here\n}\n",
    starterCodePy: "def max_profit(prices):\n    # your code here\n    pass\n",
    testCases: [
      { input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { input: [[7, 6, 4, 3, 1]], expected: 0 },
    ],
  },
  {
    title: "Group Anagrams",
    slug: "group-anagrams",
    difficulty: "MEDIUM",
    topic: "ARRAYS_STRINGS",
    prompt:
      "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.",
    constraints:
      "- `1 <= strs.length <= 10^4`\n- `0 <= strs[i].length <= 100`\n- `strs[i]` consists of lowercase English letters.",
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
    ],
    starterCodeJs: "function groupAnagrams(strs) {\n  // your code here\n}\n",
    starterCodePy: "def group_anagrams(strs):\n    # your code here\n    pass\n",
    testCases: [
      {
        input: [["eat", "tea", "tan", "ate", "nat", "bat"]],
        expected: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]],
      },
    ],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating",
    difficulty: "MEDIUM",
    topic: "ARRAYS_STRINGS",
    prompt:
      "Given a string `s`, find the length of the longest substring without repeating characters.",
    constraints:
      "- `0 <= s.length <= 5 * 10^4`\n- `s` consists of English letters, digits, symbols, and spaces.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc".' },
      { input: 's = "bbbbb"', output: "1" },
    ],
    starterCodeJs: "function lengthOfLongestSubstring(s) {\n  // your code here\n}\n",
    starterCodePy: "def length_of_longest_substring(s):\n    # your code here\n    pass\n",
    testCases: [
      { input: ["abcabcbb"], expected: 3 },
      { input: ["bbbbb"], expected: 1 },
      { input: ["pwwkew"], expected: 3 },
    ],
  },
  {
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "EASY",
    topic: "ALGORITHMS",
    prompt:
      "Given a sorted array of distinct integers `nums` and a target value, return the index of `target` if it exists, or `-1` if it does not. Implement an algorithm with `O(log n)` runtime complexity.",
    constraints:
      "- `1 <= nums.length <= 10^4`\n- `nums` is sorted in ascending order with distinct values.",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    starterCodeJs: "function search(nums, target) {\n  // your code here\n}\n",
    starterCodePy: "def search(nums, target):\n    # your code here\n    pass\n",
    testCases: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
    ],
  },
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "EASY",
    topic: "DYNAMIC_PROGRAMMING",
    prompt:
      "You are climbing a staircase with `n` steps. Each time you can climb either 1 or 2 steps. In how many distinct ways can you climb to the top?",
    constraints: "- `1 <= n <= 45`",
    examples: [
      { input: "n = 2", output: "2", explanation: "1+1 or 2" },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1" },
    ],
    starterCodeJs: "function climbStairs(n) {\n  // your code here\n}\n",
    starterCodePy: "def climb_stairs(n):\n    # your code here\n    pass\n",
    testCases: [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [5], expected: 8 },
    ],
  },
  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "MEDIUM",
    topic: "DATA_STRUCTURES",
    prompt:
      "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    constraints:
      "- `1 <= intervals.length <= 10^4`\n- `intervals[i].length == 2`\n- `0 <= start_i <= end_i <= 10^4`",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    starterCodeJs: "function merge(intervals) {\n  // your code here\n}\n",
    starterCodePy: "def merge(intervals):\n    # your code here\n    pass\n",
    testCases: [
      {
        input: [[[1, 3], [2, 6], [8, 10], [15, 18]]],
        expected: [[1, 6], [8, 10], [15, 18]],
      },
      { input: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
    ],
  },

  // ------------------------------------------------------------------
  // Java track — junior-level theory interviews + coding exercises
  // ------------------------------------------------------------------
  {
    title: "Java Fundamentals",
    slug: "java-fundamentals-theory",
    difficulty: "EASY",
    topic: "LANGUAGE_FUNDAMENTALS",
    kind: "THEORY",
    track: "JAVA",
    prompt: `This is an oral interview covering core Java knowledge expected of a junior developer. The interviewer will pick questions from this bank, one at a time, and follow up on your answers.

## Question bank

- What is the difference between the JDK, the JRE, and the JVM?
- What is the difference between \`==\` and \`.equals()\` when comparing objects?
- Why are Strings immutable in Java, and what are the practical consequences?
- What is the difference between \`String\`, \`StringBuilder\`, and \`StringBuffer\`?
- What are checked and unchecked exceptions? When would you define each?
- What does the \`final\` keyword do when applied to a variable, a method, and a class?
- What is the difference between \`static\` and instance members?
- What is autoboxing, and what subtle bug can it introduce with \`Integer\` comparison?
- What happens when you override \`equals()\` but not \`hashCode()\`?
- Walk through what happens in memory when you write \`new ArrayList<String>()\`.`,
    constraints:
      "- Answer in your own words — the interviewer probes for understanding, not memorized definitions.\n- If you don't know something, reason out loud about what you'd expect.\n- Short code sketches in the chat are welcome when they help.",
    examples: [],
    testCases: [],
  },
  {
    title: "Java OOP & Collections",
    slug: "java-oop-collections-theory",
    difficulty: "MEDIUM",
    topic: "OOP",
    kind: "THEORY",
    track: "JAVA",
    prompt: `This is an oral interview on object-oriented design and the Java Collections Framework, at junior-to-mid level. The interviewer asks one question at a time and digs into your reasoning.

## Question bank

- Explain the four pillars of OOP with a concrete Java example for each.
- What is the difference between an interface and an abstract class? When do you choose each?
- What is the difference between method overloading and method overriding?
- Why is composition often preferred over inheritance?
- Compare \`ArrayList\` and \`LinkedList\` — when does each win?
- How does a \`HashMap\` work internally? What happens on a hash collision?
- What is the difference between \`HashMap\`, \`TreeMap\`, and \`LinkedHashMap\`?
- What does the \`Comparable\` interface do, and how is it different from \`Comparator\`?
- What is a \`ConcurrentModificationException\` and how do you avoid it?
- What are generics for, and what does type erasure mean at runtime?`,
    constraints:
      "- Use concrete examples — 'ArrayList is faster' needs a *why*.\n- Expect follow-ups: a correct one-liner will be probed deeper.\n- Short code sketches in the chat are welcome.",
    examples: [],
    testCases: [],
  },
  {
    title: "Reverse Words in a Sentence",
    slug: "java-reverse-words",
    difficulty: "EASY",
    topic: "ARRAYS_STRINGS",
    kind: "CODING",
    track: "JAVA",
    prompt:
      "Write a method that takes a sentence and returns it with the **order of the words reversed**, while each word itself keeps its original character order.\n\nWords are separated by single spaces; leading/trailing whitespace should not appear in the output.",
    constraints:
      "- `1 <= sentence.length <= 10^4`\n- Words are separated by one or more spaces.\n- Do not use `Collections.reverse` — build the logic yourself.",
    examples: [
      { input: '"the sky is blue"', output: '"blue is sky the"' },
      { input: '"  hello   world  "', output: '"world hello"' },
    ],
    starterCodeJava:
      "public class Solution {\n    public static String reverseWords(String sentence) {\n        // your code here\n        return \"\";\n    }\n\n    public static void main(String[] args) {\n        System.out.println(reverseWords(\"the sky is blue\")); // blue is sky the\n    }\n}\n",
    testCases: [
      { input: ["the sky is blue"], expected: "blue is sky the" },
      { input: ["  hello   world  "], expected: "world hello" },
    ],
  },
  {
    title: "First Non-Repeating Character",
    slug: "java-first-unique-char",
    difficulty: "EASY",
    topic: "COLLECTIONS",
    kind: "CODING",
    track: "JAVA",
    prompt:
      "Given a string `s`, find the **first non-repeating character** and return its index. If every character repeats, return `-1`.\n\nThe interviewer will care about which collection you choose and why — expect to justify it.",
    constraints:
      "- `1 <= s.length <= 10^5`\n- `s` consists of lowercase English letters.\n- Aim for a single pass to count, plus one pass to find.",
    examples: [
      { input: 's = "leetcode"', output: "0" },
      { input: 's = "aabb"', output: "-1" },
    ],
    starterCodeJava:
      "public class Solution {\n    public static int firstUniqChar(String s) {\n        // your code here\n        return -1;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(firstUniqChar(\"leetcode\")); // 0\n    }\n}\n",
    testCases: [
      { input: ["leetcode"], expected: 0 },
      { input: ["loveleetcode"], expected: 2 },
      { input: ["aabb"], expected: -1 },
    ],
  },

  // ------------------------------------------------------------------
  // C++ track — junior-level theory interviews + coding exercises
  // ------------------------------------------------------------------
  {
    title: "C++ Fundamentals",
    slug: "cpp-fundamentals-theory",
    difficulty: "EASY",
    topic: "LANGUAGE_FUNDAMENTALS",
    kind: "THEORY",
    track: "CPP",
    prompt: `This is an oral interview covering core C++ knowledge expected of a junior developer. The interviewer picks questions from this bank one at a time and follows up on your answers.

## Question bank

- What is the difference between a pointer and a reference? When would you use each?
- Explain stack vs. heap allocation. What decides where an object lives?
- What does \`const\` mean in each position: \`const int*\`, \`int* const\`, \`const int* const\`?
- What is the difference between \`new\`/\`delete\` and \`malloc\`/\`free\`?
- What happens if you \`delete\` the same pointer twice? How do you prevent it?
- What is a memory leak, and what tools or techniques catch them?
- What does the compiler generate for you in a class by default (the rule of three/five)?
- What is the difference between pass-by-value, pass-by-reference, and pass-by-pointer?
- What are header files for, and what does \`#include\` actually do?
- What is undefined behavior? Give two examples a junior might write by accident.`,
    constraints:
      "- Answer in your own words — the interviewer probes for understanding, not memorized definitions.\n- If unsure, reason out loud about what you'd expect the language to do.\n- Short code sketches in the chat are welcome.",
    examples: [],
    testCases: [],
  },
  {
    title: "C++ OOP & Memory Management",
    slug: "cpp-oop-memory-theory",
    difficulty: "MEDIUM",
    topic: "MEMORY_MANAGEMENT",
    kind: "THEORY",
    track: "CPP",
    prompt: `This is an oral interview on object-oriented C++ and modern memory management, at junior-to-mid level. One question at a time, with follow-ups.

## Question bank

- What is a virtual function, and how does dynamic dispatch work under the hood?
- Why should a base class with virtual functions have a virtual destructor?
- What is RAII? Give an example of a resource it manages besides memory.
- Compare \`unique_ptr\`, \`shared_ptr\`, and \`weak_ptr\` — when is each the right tool?
- What is the difference between copy semantics and move semantics? What does \`std::move\` actually do?
- What is a dangling pointer/reference, and how do smart pointers help?
- What is the difference between overloading and overriding in C++?
- What does \`explicit\` on a constructor prevent?
- Compare \`std::vector\`, \`std::list\`, and \`std::map\` — memory layout and complexity.
- When would you make a destructor private, or delete a copy constructor?`,
    constraints:
      "- Use concrete examples — expect 'why' follow-ups on every answer.\n- Modern C++ (11 and later) idioms are preferred where relevant.\n- Short code sketches in the chat are welcome.",
    examples: [],
    testCases: [],
  },
  {
    title: "Run-Length Encoding",
    slug: "cpp-run-length-encoding",
    difficulty: "EASY",
    topic: "ARRAYS_STRINGS",
    kind: "CODING",
    track: "CPP",
    prompt:
      "Implement basic **run-length encoding**: given a string, replace each run of identical consecutive characters with the character followed by the run length.\n\nThe interviewer will pay attention to how you traverse the string and build the result.",
    constraints:
      "- `1 <= s.length <= 10^5`\n- `s` consists of uppercase and lowercase English letters.\n- Aim for a single pass with O(n) time.",
    examples: [
      { input: 's = "aaabccdddd"', output: '"a3b1c2d4"' },
      { input: 's = "abc"', output: '"a1b1c1"' },
    ],
    starterCodeCpp:
      '#include <iostream>\n#include <string>\n\nstd::string runLengthEncode(const std::string& s) {\n    // your code here\n    return "";\n}\n\nint main() {\n    std::cout << runLengthEncode("aaabccdddd") << "\\n"; // a3b1c2d4\n    return 0;\n}\n',
    testCases: [
      { input: ["aaabccdddd"], expected: "a3b1c2d4" },
      { input: ["abc"], expected: "a1b1c1" },
    ],
  },
  {
    title: "Second Largest Element",
    slug: "cpp-second-largest",
    difficulty: "EASY",
    topic: "ALGORITHMS",
    kind: "CODING",
    track: "CPP",
    prompt:
      "Given a vector of integers, return the **second largest distinct value**. If it does not exist (fewer than two distinct values), return `-1`.\n\nThe interviewer will ask about your handling of duplicates and edge cases.",
    constraints:
      "- `1 <= nums.size() <= 10^5`\n- `0 <= nums[i] <= 10^9`\n- One pass, O(1) extra space is the target.",
    examples: [
      { input: "nums = [3, 1, 4, 1, 5]", output: "4" },
      { input: "nums = [7, 7, 7]", output: "-1" },
    ],
    starterCodeCpp:
      "#include <iostream>\n#include <vector>\n\nlong long secondLargest(const std::vector<long long>& nums) {\n    // your code here\n    return -1;\n}\n\nint main() {\n    std::cout << secondLargest({3, 1, 4, 1, 5}) << \"\\n\"; // 4\n    return 0;\n}\n",
    testCases: [
      { input: [[3, 1, 4, 1, 5]], expected: 4 },
      { input: [[7, 7, 7]], expected: -1 },
      { input: [[10, 9]], expected: 9 },
    ],
  },
];

async function main() {
  console.log("Seeding problem bank...");
  for (const p of problems) {
    const data = {
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      topic: p.topic,
      kind: p.kind ?? "CODING",
      track: p.track ?? "GENERAL",
      prompt: p.prompt,
      constraints: p.constraints,
      examples: JSON.stringify(p.examples),
      starterCodeJs: p.starterCodeJs ?? "",
      starterCodePy: p.starterCodePy ?? "",
      starterCodeJava: p.starterCodeJava ?? "",
      starterCodeCpp: p.starterCodeCpp ?? "",
      testCases: JSON.stringify(p.testCases),
    };
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
  }
  console.log(`Seeded ${problems.length} problems.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
