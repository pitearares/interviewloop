import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ProblemSeed {
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM";
  topic: "ARRAYS_STRINGS" | "ALGORITHMS" | "DATA_STRUCTURES" | "DYNAMIC_PROGRAMMING";
  prompt: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
  starterCodeJs: string;
  starterCodePy: string;
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
];

async function main() {
  console.log("Seeding problem bank...");
  for (const p of problems) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topic: p.topic,
        prompt: p.prompt,
        constraints: p.constraints,
        examples: JSON.stringify(p.examples),
        starterCodeJs: p.starterCodeJs,
        starterCodePy: p.starterCodePy,
        testCases: JSON.stringify(p.testCases),
      },
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
