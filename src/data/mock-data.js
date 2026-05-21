// ============================================================
// NPS Mock Data — Full dataset for all pages
// ============================================================

export const currentUser = {
  id: 'u1',
  name: 'Rushil',
  fullName: 'Rushil Sunder',
  initials: 'RS',
  streak: 0,
  totalQuestions: 0,
  overallMastery: 0,
};

// ——————————————————————————————————————————————
// SUBJECTS & CHAPTERS
// ——————————————————————————————————————————————

export const subjects = [
  {
    id: 'physics',
    name: 'Physics',
    subtitle: 'JEE Advanced',
    icon: 'atom',
    color: '#7C5CFC',
    bgClass: 'subject-physics',
    todayDone: 0,
    todayGoal: 10,
    mastery: 0,
    score: 0,
    chapters: [
      {
        id: 'units',
        name: 'Units and Dimensions',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'units-basic', name: 'Dimensional Analysis & Applications', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'units-inter', name: 'Significant Figures & Error Analysis', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'units-adv', name: 'Advanced Measurement Instruments', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'math-tools',
        name: 'Mathematical Tools',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'math-tools-basic', name: 'Calculus for Physics', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'vectors',
        name: 'Vectors',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'vectors-dot-cross', name: 'Dot & Cross Products', module: 'Allen M2', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'vectors-3d', name: 'Vectors in 3D Space & Resolution', module: 'Allen M2', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'kinematics',
        name: 'Kinematics',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'kin-1d', name: 'Motion in 1D & Graphs', module: 'Allen M3', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'kin-2d', name: 'Projectile Motion', module: 'Allen M3', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'kin-relative', name: 'Relative Motion in 1D & 2D', module: 'Allen M3', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'nlm',
        name: "Newton's Laws of Motion",
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'nlm-basic', name: 'Free Body Diagrams & Equilibrium', module: 'Allen M4', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'nlm-friction', name: 'Friction and Dynamics', module: 'Allen M4', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'thermo',
        name: 'Thermodynamics',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'thermo-basic', name: 'First Law of Thermodynamics & Processes', module: 'Allen M7', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    subtitle: 'JEE Advanced',
    icon: 'flask-conical',
    color: '#12A67C',
    bgClass: 'subject-chemistry',
    todayDone: 0,
    todayGoal: 10,
    mastery: 0,
    score: 0,
    chapters: [
      {
        id: 'atomic-structure',
        name: 'Atomic Structure',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'atom-basic', name: 'Bohr Model & Hydrogen Spectrum', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'atom-quantum', name: 'Quantum Numbers & Orbitals', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'periodic-table',
        name: 'Periodic Table & Properties',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'periodic-basic', name: 'Periodic Trends: IE, EA, and Electronegativity', module: 'Allen M2', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'chemical-bonding',
        name: 'Chemical Bonding',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'bond-basic', name: 'VSEPR Theory & Hybridization', module: 'Allen M3', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'bond-mol-orbital', name: 'Molecular Orbital Theory', module: 'Allen M3', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'mole-concept',
        name: 'Mole Concept',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'mole-basic', name: 'Stoichiometry & Molar Mass', module: 'Allen M2', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
    ],
  },
  {
    id: 'math',
    name: 'Mathematics',
    subtitle: 'JEE Advanced',
    icon: 'sigma',
    color: '#E87D2F',
    bgClass: 'subject-math',
    todayDone: 0,
    todayGoal: 10,
    mastery: 0,
    score: 0,
    chapters: [
      {
        id: 'sets',
        name: 'Sets & Relations',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'sets-basic', name: 'Sets & Venn Diagrams', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'sets-relations', name: 'Types of Relations & Functions', module: 'Allen M1', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'complex-numbers',
        name: 'Complex Numbers',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'complex-basic', name: 'Algebra of Complex Numbers', module: 'Allen M2', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'complex-geo', name: 'Argand Plane & Locus', module: 'Allen M2', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'quadratic',
        name: 'Quadratic Equations',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'quad-basic', name: 'Roots & Coefficients', module: 'Allen M3', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'sequences',
        name: 'Sequences and Series',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'seq-ap', name: 'Arithmetic Progressions', module: 'Allen M4', status: 'unlocked', totalQ: 5, doneQ: 0 },
          { id: 'seq-gp', name: 'Geometric Progressions', module: 'Allen M4', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
      {
        id: 'trig',
        name: 'Trigonometry',
        status: 'unlocked',
        mastery: 0,
        kcs: [
          { id: 'trig-basic', name: 'Angles & T-Ratios', module: 'Allen M5', status: 'unlocked', totalQ: 5, doneQ: 0 },
        ],
      },
    ],
  },
];

// ——————————————————————————————————————————————
// QUESTIONS (per KC ID)
// ——————————————————————————————————————————————

export const questions = {
  // --- Physics ---
  'units-basic': [
    {
      id: 'ub1',
      text: 'The dimensional formula of angular momentum is:',
      options: ['\\([M L^2 T^{-1}]\\)', '\\([M L T^{-1}]\\)', '\\([M L^2 T^{-2}]\\)', '\\([M^0 L^2 T^{-1}]\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'ub2',
      text: 'If Force \\((F)\\), Length \\((L)\\) and Time \\((T)\\) are chosen as fundamental quantities, the dimensional formula of mass is:',
      options: ['\\([F L^{-1} T^2]\\)', '\\([F L T^{-2}]\\)', '\\([F^{-1} L^{-1} T^{-2}]\\)', '\\([F L^{-1} T^{-2}]\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'ub3',
      text: 'The dimensions of permittivity of free space \\((\\epsilon_0)\\) in terms of standard dimensions are:',
      options: ['\\([M^{-1} L^{-3} T^4 A^2]\\)', '\\([M^{-1} L^{-3} T^2 A]\\)', '\\([M L^{-3} T^4 A^2]\\)', '\\([M^{-1} L^{-3} T^{-4} A^{-2}]\\)'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'ub4',
      text: 'The dimensions of self-inductance \\((L)\\) are:',
      options: ['\\([M L^2 T^{-2} A^{-2}]\\)', '\\([M L^2 T^{-1} A^{-2}]\\)', '\\([M L^2 T^{-2} A^{-1}]\\)', '\\([M L T^{-2} A^{-2}]\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'ub5',
      text: 'The dimensional formula for the quantity \\(\\frac{1}{\\sqrt{\\mu_0 \\epsilon_0}}\\) is equivalent to the dimensions of:',
      options: ['Velocity', 'Acceleration', 'Force', 'Refractive Index'],
      correct: 0,
      difficulty: 'easy',
    }
  ],
  'units-inter': [
    {
      id: 'ui1',
      text: 'The number of significant figures in \\(0.00340200\\) is:',
      options: ['3', '4', '5', '6'],
      correct: 3,
      difficulty: 'easy',
    },
    {
      id: 'ui2',
      text: 'The percentage errors in quantities \\(P, Q, R\\) and \\(S\\) are \\(0.5\\%\\), \\(1\\%\\), \\(3\\%\\), and \\(1.5\\%\\) respectively. The quantity \\(Z = \\frac{P^3 Q^2}{\\sqrt{R} \\cdot S}\\) will have a maximum percentage error of:',
      options: ['\\(6.5\\%\\)', '\\(7.5\\%\\)', '\\(5.0\\%\\)', '\\(8.0\\%\\)'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'ui3',
      text: 'In an experiment, the mass and side length of a copper cube are measured with errors of \\(1\\%\\) and \\(2\\%\\) respectively. The maximum percentage error in the estimation of its density is:',
      options: ['\\(3\\%\\)', '\\(5\\%\\)', '\\(7\\%\\)', '\\(9\\%\\)'],
      correct: 2,
      difficulty: 'medium',
    },
    {
      id: 'ui4',
      text: 'Two resistance measurements are given as \\(R_1 = (100 \\pm 3)\\,\\Omega\\) and \\(R_2 = (200 \\pm 4)\\,\\Omega\\). When connected in series, the equivalent resistance with its absolute error is:',
      options: ['\\((300 \\pm 7)\\,\\Omega\\)', '\\((300 \\pm 1)\\,\\Omega\\)', '\\((300 \\pm 12)\\,\\Omega\\)', '\\((300 \\pm 5)\\,\\Omega\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'ui5',
      text: 'Express the sum of \\(436.32\\) g, \\(227.2\\) g, and \\(0.301\\) g to the correct number of significant figures:',
      options: ['\\(663.8\\) g', '\\(663.821\\) g', '\\(664\\) g', '\\(663.82\\) g'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'units-adv': [
    {
      id: 'ua1',
      text: 'A vernier caliper has 1 MSD = 1 mm. 10 divisions on the vernier scale coincide with 9 divisions on the main scale. The least count of this instrument is:',
      options: ['\\(0.1\\) mm', '\\(0.01\\) mm', '\\(0.2\\) mm', '\\(0.05\\) mm'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'ua2',
      text: 'A screw gauge has a pitch of 1 mm and 100 divisions on its circular scale. When nothing is placed between its studs, the 5th division of circular scale is below the reference line. The zero error is:',
      options: ['\\(+0.05\\) mm', '\\(-0.05\\) mm', '\\(+0.5\\) mm', '\\(-0.5\\) mm'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'ua3',
      text: 'While measuring the diameter of a wire using a screw gauge of pitch 0.5 mm and 50 circular divisions, the main scale reads 2.5 mm and the 20th circular division coincides with the reference line. The diameter of the wire is:',
      options: ['\\(2.70\\) mm', '\\(2.60\\) mm', '\\(2.80\\) mm', '\\(2.52\\) mm'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'ua4',
      text: 'If in a vernier caliper, \\(N\\) divisions of the vernier scale coincide with \\((N-1)\\) divisions of the main scale (where 1 MSD = \\(x\\) units), the least count is:',
      options: ['\\(\\frac{x}{N}\\)', '\\(\\frac{x}{N-1}\\)', '\\(\\frac{x(N-1)}{N}\\)', '\\(\\frac{x(N+1)}{N}\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'ua5',
      text: 'In a screw gauge, the circular scale is rotated through 4 complete revolutions to advance a distance of 2 mm. The circular scale contains 50 divisions. The least count of the screw gauge is:',
      options: ['\\(0.01\\) mm', '\\(0.005\\) mm', '\\(0.02\\) mm', '\\(0.04\\) mm'],
      correct: 0,
      difficulty: 'hard',
    }
  ],
  'math-tools-basic': [
    {
      id: 'mt1',
      text: 'The derivative of \\(y = x^3 \\sin x\\) with respect to \\(x\\) is:',
      options: ['\\(3x^2 \\sin x + x^3 \\cos x\\)', '\\(3x^2 \\cos x\\)', '\\(3x^2 \\sin x - x^3 \\cos x\\)', '\\(x^3 \\cos x - 3x^2 \\sin x\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'mt2',
      text: 'Evaluate the definite integral \\(\\int_0^{\\pi} \\sin x \\, dx\\).',
      options: ['\\(0\\)', '\\(1\\)', '\\(2\\)', '\\(-2\\)'],
      correct: 2,
      difficulty: 'easy',
    },
    {
      id: 'mt3',
      text: 'Find the maximum value of the function \\(f(x) = -x^2 + 4x + 5\\).',
      options: ['\\(5\\)', '\\(9\\)', '\\(4\\)', '\\(1\\)'],
      correct: 1,
      difficulty: 'medium',
    },
    {
      id: 'mt4',
      text: 'The position of a particle along the x-axis is given by \\(x = 2t^3 - 9t^2 + 12t\\) (in meters). The acceleration of the particle when its velocity becomes zero is:',
      options: ['\\(\\pm 6\\text{ m/s}^2\\)', '\\(\\pm 12\\text{ m/s}^2\\)', '\\(0\\text{ m/s}^2\\)', '\\(9\\text{ m/s}^2\\)'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'mt5',
      text: 'The average value of \\(y = \\sin^2 \\theta\\) over a complete cycle from \\(\\theta = 0\\) to \\(\\theta = 2\\pi\\) is:',
      options: ['\\(1\\)', '\\(\\frac{1}{2}\\)', '\\(0\\)', '\\(\\frac{1}{\\sqrt{2}}\\)'],
      correct: 1,
      difficulty: 'medium',
    }
  ],
  'vectors-dot-cross': [
    {
      id: 'vd1',
      text: 'If the velocity of a particle is \\((2\\hat{i} + 3\\hat{j} - 4\\hat{k})\\) and its acceleration is \\((-\\hat{i} + 2\\hat{j} + \\hat{k})\\) and the angle between them is \\(\\frac{n\\pi}{4}\\), the value of \\(n\\) is:',
      options: ['8', '6', '4', '2'],
      correct: 3,
      difficulty: 'medium',
    },
    {
      id: 'vd2',
      text: 'If \\(\\vec{A} = 3\\hat{i} + 4\\hat{j}\\) and \\(\\vec{B} = 7\\hat{i} + 24\\hat{j}\\), find the vector having the same magnitude as \\(\\vec{B}\\) and parallel to \\(\\vec{A}\\).',
      options: ['\\(15\\hat{i} + 20\\hat{j}\\)', '\\(20\\hat{i} + 15\\hat{j}\\)', '\\(\\frac{75}{5}\\hat{i} + \\frac{100}{5}\\hat{j}\\)', 'None of these'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'vd3',
      text: 'The angle between two vectors \\(\\vec{A} = 3\\hat{i} + 4\\hat{j} + 5\\hat{k}\\) and \\(\\vec{B} = 3\\hat{i} + 4\\hat{j} - 5\\hat{k}\\) is:',
      options: ['\\(60°\\)', '\\(90°\\)', '\\(\\cos^{-1}(\\frac{-7}{25})\\)', '\\(\\cos^{-1}(\\frac{0}{50})\\)'],
      correct: 2,
      difficulty: 'easy',
    },
    {
      id: 'vd4',
      text: 'If \\(|\\vec{A} \\times \\vec{B}| = \\sqrt{3}\\, \\vec{A} \\cdot \\vec{B}\\), then the angle between \\(\\vec{A}\\) and \\(\\vec{B}\\) is:',
      options: ['\\(30°\\)', '\\(60°\\)', '\\(45°\\)', '\\(90°\\)'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'vd5',
      text: 'The area of a parallelogram whose adjacent sides are represented by \\(\\vec{A} = \\hat{i} + 2\\hat{j} + 3\\hat{k}\\) and \\(\\vec{B} = \\hat{i} - 3\\hat{j} + \\hat{k}\\) is:',
      options: ['\\(\\sqrt{155}\\) sq. units', '\\(\\sqrt{165}\\) sq. units', '\\(\\sqrt{145}\\) sq. units', '\\(\\sqrt{175}\\) sq. units'],
      correct: 1,
      difficulty: 'medium',
    }
  ],
  'vectors-3d': [
    {
      id: 'v3d1',
      text: 'A unit vector perpendicular to both \\(\\vec{A} = 2\\hat{i} + 3\\hat{j} + \\hat{k}\\) and \\(\\vec{B} = \\hat{i} - \\hat{j} + 2\\hat{k}\\) is:',
      options: ['\\(\\frac{7\\hat{i} - 3\\hat{j} - 5\\hat{k}}{\\sqrt{83}}\\)', '\\(\\frac{7\\hat{i} + 3\\hat{j} + 5\\hat{k}}{\\sqrt{83}}\\)', '\\(\\frac{5\\hat{i} - 3\\hat{j} - 7\\hat{k}}{\\sqrt{83}}\\)', '\\(\\frac{-7\\hat{i} + 3\\hat{j} + 5\\hat{k}}{\\sqrt{83}}\\)'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'v3d2',
      text: 'What is the projection of the vector \\(\\vec{A} = \\hat{i} + 3\\hat{j} + 2\\hat{k}\\) on the y-axis?',
      options: ['1', '3', '2', '\\(\\sqrt{14}\\)'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'v3d3',
      text: 'If the vector \\(\\vec{A} = a\\hat{i} + 3\\hat{j} + 4\\hat{k}\\) is perpendicular to \\(\\vec{B} = 2\\hat{i} - 2\\hat{j} + \\hat{k}\\), the value of \\(a\\) is:',
      options: ['\\(1\\)', '\\(-1\\)', '\\(2\\)', '\\(-2\\)'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'v3d4',
      text: 'A vector \\(\\vec{P}\\) makes equal angles with the x, y, and z axes. The direction cosines of \\(\\vec{P}\\) are:',
      options: ['\\(\\pm\\frac{1}{\\sqrt{3}}, \\pm\\frac{1}{\\sqrt{3}}, \\pm\\frac{1}{\\sqrt{3}}\\)', '\\(\\pm\\frac{1}{2}, \\pm\\frac{1}{2}, \\pm\\frac{1}{2}\\)', '\\(\\pm\\frac{1}{\\sqrt{2}}, \\pm\\frac{1}{\\sqrt{2}}, \\pm\\frac{1}{\\sqrt{2}}\\)', '\\(\\pm 1, \\pm 1, \\pm 1\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'v3d5',
      text: 'For what value of \\(m\\) will the three vectors \\(\\vec{A} = 2\\hat{i} - \\hat{j} + \\hat{k}\\), \\(\\vec{B} = \\hat{i} + 2\\hat{j} - 3\\hat{k}\\), and \\(\\vec{C} = 3\\hat{i} + m\\hat{j} + 5\\hat{k}\\) be coplanar?',
      options: ['\\(-4\\)', '\\(4\\)', '\\(-2\\)', '\\(2\\)'],
      correct: 0,
      difficulty: 'hard',
    }
  ],
  'kin-1d': [
    {
      id: 'k1d1',
      text: 'A ball is thrown vertically upward with a velocity of 20 m/s from the top of a building of height 25 m. How long will it take to reach the ground? (Take \\(g = 10\\text{ m/s}^2\\)):',
      options: ['\\(5\\) s', '\\(3\\) s', '\\(4\\) s', '\\(2\\) s'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'k1d2',
      text: 'A particle moves along the x-axis according to the equation \\(x = 3t^2 - 6t + 5\\). The velocity of the particle at \\(t = 0\\) is:',
      options: ['-6 m/s', '0 m/s', '3 m/s', '6 m/s'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'k1d3',
      text: 'A car travels the first half of the distance between two places at 40 km/h and the second half at 60 km/h. The average speed of the car for the entire journey is:',
      options: ['\\(48\\) km/h', '\\(50\\) km/h', '\\(45\\) km/h', '\\(52\\) km/h'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'k1d4',
      text: 'A body starts from rest and moves with uniform acceleration. The ratio of the distance covered in the 3rd second to that in the 4th second is:',
      options: ['\\(5:7\\)', '\\(3:4\\)', '\\(9:16\\)', '\\(1:2\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'k1d5',
      text: 'The displacement-time graph of a moving particle is a straight line making an angle of 30° with the time axis. After a while, it changes to a line making 60° with the time axis. The ratio of the two velocities is:',
      options: ['\\(1:3\\)', '\\(3:1\\)', '\\(1:\\sqrt{3}\\)', '\\(\\sqrt{3}:1\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'kin-2d': [
    {
      id: 'k2d1',
      text: 'A projectile is thrown with a velocity \\(v_0\\) at an angle \\(\\theta\\) with the horizontal. The ratio of its maximum height to its horizontal range is:',
      options: ['\\(\\frac{1}{4}\\tan\\theta\\)', '\\(\\frac{1}{2}\\tan\\theta\\)', '\\(\\tan\\theta\\)', '\\(2\\tan\\theta\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'k2d2',
      text: 'The equation of a projectile is \\(y = \\sqrt{3}x - \\frac{g x^2}{2}\\). The angle of projection is:',
      options: ['\\(60°\\)', '\\(30°\\)', '\\(45°\\)', '\\(90°\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'k2d3',
      text: 'A particle is projected with kinetic energy \\(K\\) at an angle of 60° with the horizontal. The kinetic energy of the particle at the highest point of its trajectory is:',
      options: ['\\(K/4\\)', '\\(K/2\\)', '\\(3K/4\\)', '\\(K\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'k2d4',
      text: 'For a projectile, the ratio of the square of the time of flight to the maximum height is: (Take \\(g = 10\\text{ m/s}^2\\))',
      options: ['\\(4:5\\)', '\\(5:4\\)', '\\(8:5\\)', '\\(5:8\\)'],
      correct: 2,
      difficulty: 'hard',
    },
    {
      id: 'k2d5',
      text: 'Two projectiles are projected with the same velocity but at angles \\(45°-\\theta\\) and \\(45°+\\theta\\). The ratio of their horizontal ranges is:',
      options: ['\\(1:1\\)', '\\(1:2\\)', '\\(2:1\\)', '\\(1:\\sqrt{2}\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'kin-relative': [
    {
      id: 'kr1',
      text: 'A man is walking horizontally at 3 km/h and rain is falling vertically at 4 km/h. At what angle with the vertical should the man hold his umbrella to protect himself?',
      options: ['\\(\\tan^{-1}(3/4)\\)', '\\(\\tan^{-1}(4/3)\\)', '\\(\\sin^{-1}(3/5)\\)', '\\(\\cos^{-1}(3/5)\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'kr2',
      text: 'A boat can travel with a speed of 5 km/h in still water. If the width of the river is 1 km and the river flows at 3 km/h, what is the shortest time in which the boat can cross the river?',
      options: ['\\(12\\) min', '\\(15\\) min', '\\(20\\) min', '\\(10\\) min'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'kr3',
      text: 'Two trains, each of length 100 m, are moving in opposite directions along parallel tracks with speeds of 10 m/s and 15 m/s. The time taken by them to cross each other is:',
      options: ['\\(8\\) s', '\\(4\\) s', '\\(10\\) s', '\\(6\\) s'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'kr4',
      text: 'A ship A is moving westwards at 10 km/h and a ship B is 100 km south of A, moving northwards at 10 km/h. The time after which the distance between them becomes shortest is:',
      options: ['\\(5\\) h', '\\(5\\sqrt{2}\\) h', '\\(10\\) h', '\\(10\\sqrt{2}\\) h'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'kr5',
      text: 'A swimmer swims in still water with a speed of 5 km/h. The river flows at 3 km/h. To reach the point directly opposite to his starting point, he should swim at an angle \\(\\theta\\) with the upstream direction equal to:',
      options: ['\\(127°\\)', '\\(143°\\)', '\\(90°\\)', '\\(120°\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'nlm-basic': [
    {
      id: 'nlmb1',
      text: 'Three blocks of masses 1 kg, 2 kg, and 3 kg are placed in contact on a frictionless table. A force of 12 N is applied to the 1 kg block. The contact force between the 2 kg and 3 kg block is:',
      options: ['\\(6\\) N', '\\(8\\) N', '\\(4\\) N', '\\(2\\) N'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'nlmb2',
      text: 'A mass of 10 kg is suspended by two ropes. One rope is horizontal and the other makes an angle of 45° with the vertical. The tension in the horizontal rope is: (Take \\(g = 10\\text{ m/s}^2\\))',
      options: ['\\(100\\) N', '\\(100\\sqrt{2}\\) N', '\\(50\\) N', '\\(50\\sqrt{2}\\) N'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'nlmb3',
      text: 'A lift is moving upwards with an acceleration of \\(2\\text{ m/s}^2\\). A man of mass 60 kg inside the lift stands on a weighing scale. The reading of the scale is: (Take \\(g = 10\\text{ m/s}^2\\))',
      options: ['\\(720\\) N', '\\(480\\) N', '\\(600\\) N', '\\(120\\) N'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'nlmb4',
      text: 'A mass of 2 kg rests on a frictionless inclined plane of angle 30°. The force parallel to the incline needed to keep it at rest is: (Take \\(g = 10\\text{ m/s}^2\\))',
      options: ['\\(10\\) N', '\\(10\\sqrt{3}\\) N', '\\(20\\) N', '\\(5\\) N'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'nlmb5',
      text: 'In an Atwood machine, the two suspended masses are 3 kg and 5 kg. The acceleration of the system is: (Take \\(g = 10\\text{ m/s}^2\\))',
      options: ['\\(2.5\\text{ m/s}^2\\)', '\\(4.0\\text{ m/s}^2\\)', '\\(1.5\\text{ m/s}^2\\)', '\\(5.0\\text{ m/s}^2\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'nlm-friction': [
    {
      id: 'nlmf1',
      text: 'A block of mass 10 kg is placed on a rough horizontal surface with coefficient of static friction \\(\\mu_s = 0.5\\) and coefficient of kinetic friction \\(\\mu_k = 0.4\\). If a force of 45 N is applied horizontally, the friction force acting on the block is: (Take \\(g = 10\\text{ m/s}^2\\))',
      options: ['\\(45\\) N', '\\(50\\) N', '\\(40\\) N', '\\(0\\) N'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'nlmf2',
      text: 'A block of mass 2 kg is pressed against a vertical wall with a horizontal force of 100 N. If \\(\\mu_s = 0.3\\), the friction force acting on the block is: (Take \\(g = 10\\text{ m/s}^2\\))',
      options: ['\\(20\\) N', '\\(30\\) N', '\\(10\\) N', '\\(15\\) N'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'nlmf3',
      text: 'The angle of an inclined plane is gradually increased. At an angle of 30°, a block placed on it just begins to slide. The coefficient of static friction between the block and the plane is:',
      options: ['\\(\\frac{1}{\\sqrt{3}}\\)', '\\(\\sqrt{3}\\)', '\\(0.5\\)', '\\(0.866\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'nlmf4',
      text: 'A block of mass 2 kg is placed on a rough inclined plane of inclination 30° with \\(\\mu_s = 0.6\\). The friction force acting on the block is:',
      options: ['\\(10\\) N', '\\(6\\sqrt{3}\\) N', '\\(12\\) N', '\\(5\\) N'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'nlmf5',
      text: 'A block of mass \\(m\\) is placed on a rough horizontal surface. The minimum force required to drag the block along the surface is:',
      options: ['\\(\\frac{\\mu mg}{\\sqrt{1+\\mu^2}}\\)', '\\(\\mu mg\\)', '\\(\\frac{\\mu mg}{1+\\mu^2}\\)', '\\(\\frac{mg}{\\sqrt{1+\\mu^2}}\\)'],
      correct: 0,
      difficulty: 'hard',
    }
  ],
  'thermo-basic': [
    {
      id: 'thb1',
      text: 'During an isothermal expansion of an ideal gas, which of the following is true?',
      options: ['\\(\\Delta U = 0\\)', '\\(Q = 0\\)', '\\(W = 0\\)', '\\(P \\propto V\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'thb2',
      text: 'A Carnot engine operates between temperatures of 300 K and 600 K. Its efficiency is:',
      options: ['\\(50\\%\\)', '\\(33\\%\\)', '\\(67\\%\\)', '\\(100\\%\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'thb3',
      text: 'In a thermodynamic process, a gas absorbs 500 J of heat and does 200 J of work. The change in internal energy of the gas is:',
      options: ['\\(300\\) J', '\\(700\\) J', '\\(-300\\) J', '\\(500\\) J'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'thb4',
      text: 'An ideal gas undergoes an adiabatic process in which its volume is doubled. The final pressure of the gas is: (where \\(\\gamma = 1.5\\))',
      options: ['\\(P_0 / 2\\sqrt{2}\\)', '\\(P_0 / 2\\)', '\\(2\\sqrt{2}\\, P_0\\)', '\\(4 P_0\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'thb5',
      text: 'For a monoatomic gas, the ratio of specific heats \\(\\gamma = C_p/C_v\\) is:',
      options: ['\\(5/3\\)', '\\(7/5\\)', '\\(4/3\\)', '\\(9/7\\)'],
      correct: 0,
      difficulty: 'easy',
    }
  ],

  // --- Chemistry ---
  'atom-basic': [
    {
      id: 'atb1',
      text: 'The energy of the electron in the \\(n = 2\\) state of hydrogen atom is \\(-3.4\\) eV. Its kinetic energy in this state is:',
      options: ['\\(3.4\\) eV', '\\(6.8\\) eV', '\\(-3.4\\) eV', '\\(1.7\\) eV'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'atb2',
      text: "The radius of Bohr's first orbit in hydrogen atom is \\(0.529\\) Å. The radius of the third orbit of \\(\\text{He}^+\\) is:",
      options: ['\\(2.38\\) Å', '\\(4.77\\) Å', '\\(0.529\\) Å', '\\(1.59\\) Å'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'atb3',
      text: 'The ratio of the wavelengths of the first line of the Lyman series to the first line of the Balmer series in hydrogen spectrum is:',
      options: ['\\(5/27\\)', '\\(27/5\\)', '\\(9/4\\)', '\\(4/9\\)'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'atb4',
      text: 'The ionization energy of hydrogen atom is 13.6 eV. The ionization energy of \\(\\text{Li}^{2+}\\) is:',
      options: ['\\(122.4\\) eV', '\\(40.8\\) eV', '\\(13.6\\) eV', '\\(27.2\\) eV'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'atb5',
      text: 'The velocity of an electron in the first Bohr orbit of hydrogen atom is \\(v\\). The velocity of the electron in the third orbit of \\(\\text{He}^+\\) is:',
      options: ['\\(2v/3\\)', '\\(v/3\\)', '\\(3v/2\\)', '\\(4v/3\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'atom-quantum': [
    {
      id: 'atq1',
      text: 'Which set of quantum numbers is NOT allowed?',
      options: ['\\(n=3, l=2, m_l=-2, m_s=+\\frac{1}{2}\\)', '\\(n=2, l=0, m_l=0, m_s=-\\frac{1}{2}\\)', '\\(n=2, l=2, m_l=0, m_s=+\\frac{1}{2}\\)', '\\(n=4, l=3, m_l=3, m_s=-\\frac{1}{2}\\)'],
      correct: 2,
      difficulty: 'easy',
    },
    {
      id: 'atq2',
      text: 'The maximum number of electrons with \\(n=3, l=2, m_l=-1\\) is:',
      options: ['1', '2', '5', '10'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'atq3',
      text: 'The number of radial nodes and angular nodes in a 3p orbital are respectively:',
      options: ['1, 1', '2, 0', '0, 2', '1, 2'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'atq4',
      text: 'Which of the following orbitals has zero probability density in the xy-plane?',
      options: ['\\(p_z\\)', '\\(p_x\\)', '\\(p_y\\)', '\\(d_{xy}\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'atq5',
      text: 'The correct ground-state electronic configuration of Chromium (Z = 24) is:',
      options: ['\\([\\text{Ar}] 3d^5 4s^1\\)', '\\([\\text{Ar}] 3d^4 4s^2\\)', '\\([\\text{Ar}] 3d^6 4s^0\\)', '\\([\\text{Ar}] 3d^5 4s^2\\)'],
      correct: 0,
      difficulty: 'easy',
    }
  ],
  'periodic-basic': [
    {
      id: 'pb1',
      text: 'Which of the following has the highest first ionization energy?',
      options: ['\\(\\text{B}\\)', '\\(\\text{C}\\)', '\\(\\text{N}\\)', '\\(\\text{O}\\)'],
      correct: 2,
      difficulty: 'easy',
    },
    {
      id: 'pb2',
      text: 'The correct order of electron gain enthalpy (most negative to least negative) for halogens is:',
      options: ['\\(\\text{Cl} > \\text{F} > \\text{Br} > \\text{I}\\)', '\\(\\text{F} > \\text{Cl} > \\text{Br} > \\text{I}\\)', '\\(\\text{Cl} > \\text{Br} > \\text{I} > \\text{F}\\)', '\\(\\text{F} > \\text{Cl} > \\text{I} > \\text{Br}\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'pb3',
      text: 'Which of the following oxides is amphoteric in nature?',
      options: ['\\(\\text{Al}_2\\text{O}_3\\)', '\\(\\text{Na}_2\\text{O}\\)', '\\(\\text{Cl}_2\\text{O}_7\\)', '\\(\\text{CaO}\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'pb4',
      text: 'The correct order of ionic radii for the isoelectronic species is:',
      options: ['\\(\\text{O}^{2-} > \\text{F}^- > \\text{Na}^+ > \\text{Mg}^{2+}\\)', '\\(\\text{Mg}^{2+} > \\text{Na}^+ > \\text{F}^- > \\text{O}^{2-}\\)', '\\(\\text{Na}^+ > \\text{Mg}^{2+} > \\text{F}^- > \\text{O}^{2-}\\)', '\\(\\text{F}^- > \\text{O}^{2-} > \\text{Mg}^{2+} > \\text{Na}^+\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'pb5',
      text: 'Among the elements B, Al, C and Si, the element with the highest first ionization energy is:',
      options: ['\\(\\text{C}\\)', '\\(\\text{B}\\)', '\\(\\text{Si}\\)', '\\(\\text{Al}\\)'],
      correct: 0,
      difficulty: 'hard',
    }
  ],
  'chemical-bonding': [
    // We reuse bond-basic and bond-mol-orbital keys as they represent chemical bonding concepts.
    // In our subjects structure: chapters chemical-bonding has KCs bond-basic and bond-mol-orbital
  ],
  'bond-basic': [
    {
      id: 'bb1',
      text: 'The hybridization and shape of \\(\\text{SF}_4\\) are respectively:',
      options: ['\\(sp^3d\\), Seesaw', '\\(sp^3d\\), Tetrahedral', '\\(sp^3d^2\\), Square Planar', '\\(sp^3\\), Pyramidal'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'bb2',
      text: 'According to VSEPR theory, the molecule/ion with a square planar geometry is:',
      options: ['\\(\\text{XeF}_4\\)', '\\(\\text{SF}_4\\)', '\\(\\text{BF}_4^-\\)', '\\(\\text{NH}_4^+\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'bb3',
      text: 'The correct order of bond angles in \\(\\text{CH}_4\\), \\(\\text{NH}_3\\) and \\(\\text{H}_2\\text{O}\\) is:',
      options: ['\\(\\text{CH}_4 > \\text{NH}_3 > \\text{H}_2\\text{O}\\)', '\\(\\text{H}_2\\text{O} > \\text{NH}_3 > \\text{CH}_4\\)', '\\(\\text{CH}_4 > \\text{H}_2\\text{O} > \\text{NH}_3\\)', '\\(\\text{NH}_3 > \\text{CH}_4 > \\text{H}_2\\text{O}\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'bb4',
      text: 'Which of the following molecules has a net non-zero dipole moment?',
      options: ['\\(\\text{NF}_3\\)', '\\(\\text{BF}_3\\)', '\\(\\text{CO}_2\\)', '\\(\\text{CCl}_4\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'bb5',
      text: 'In which of the following pairs, both species have the same shape?',
      options: ['\\(\\text{CO}_2\\) and \\(\\text{SO}_2\\)', '\\(\\text{BF}_3\\) and \\(\\text{NF}_3\\)', '\\(\\text{NH}_4^+\\) and \\(\\text{CH}_4\\)', '\\(\\text{XeF}_2\\) and \\(\\text{SF}_2\\)'],
      correct: 2,
      difficulty: 'hard',
    }
  ],
  'bond-mol-orbital': [
    {
      id: 'bmo1',
      text: 'According to Molecular Orbital Theory, which of the following is paramagnetic?',
      options: ['\\(\\text{B}_2\\)', '\\(\\text{C}_2\\)', '\\(\\text{N}_2\\)', '\\(\\text{O}_2^{2-}\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'bmo2',
      text: 'The bond order of \\(\\text{O}_2^+\\) is:',
      options: ['\\(2.5\\)', '\\(2.0\\)', '\\(1.5\\)', '\\(3.0\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'bmo3',
      text: 'Which of the following species does NOT exist based on molecular orbital theory?',
      options: ['\\(\\text{He}_2\\)', '\\(\\text{H}_2^+\\)', '\\(\\text{He}_2^+\\)', '\\(\\text{Li}_2\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'bmo4',
      text: 'During the conversion of \\(\\text{N}_2\\) to \\(\\text{N}_2^+\\), the electron is removed from:',
      options: ['\\(\\sigma_{2p_z}\\) orbital', '\\(\\pi_{2p_x}\\) orbital', '\\(\\pi^*_{2p_x}\\) orbital', '\\(\\sigma^*_{2s}\\) orbital'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'bmo5',
      text: 'Which of the following orders of bond strength is correct?',
      options: ['\\(\\text{O}_2^+ > \\text{O}_2 > \\text{O}_2^- > \\text{O}_2^{2-}\\)', '\\(\\text{O}_2^{2-} > \\text{O}_2^- > \\text{O}_2 > \\text{O}_2^+\\)', '\\(\\text{O}_2 > \\text{O}_2^+ > \\text{O}_2^- > \\text{O}_2^{2-}\\)', '\\(\\text{O}_2^+ > \\text{O}_2^- > \\text{O}_2 > \\text{O}_2^{2-}\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'mole-basic': [
    {
      id: 'mb1',
      text: 'How many moles of \\(\\text{O}_2\\) are needed for complete combustion of \\(2\\) moles of \\(\\text{C}_2\\text{H}_6\\)?',
      options: ['\\(5\\)', '\\(7\\)', '\\(3.5\\)', '\\(6\\)'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'mb2',
      text: 'What is the molarity of a solution prepared by dissolving 4.0 g of NaOH in enough water to make 250 mL of solution? (Molar mass of NaOH = 40 g/mol)',
      options: ['\\(0.1\\text{ M}\\)', '\\(0.2\\text{ M}\\)', '\\(0.4\\text{ M}\\)', '\\(1.0\\text{ M}\\)'],
      correct: 2,
      difficulty: 'easy',
    },
    {
      id: 'mb3',
      text: 'The number of oxygen atoms in 4.4 g of \\(\\text{CO}_2\\) is:',
      options: ['\\(1.20 \\times 10^{23}\\)', '\\(6.02 \\times 10^{22}\\)', '\\(6.02 \\times 10^{23}\\)', '\\(1.20 \\times 10^{22}\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'mb4',
      text: 'An organic compound contains \\(40\\%\\) carbon, \\(6.67\\%\\) hydrogen and \\(53.33\\%\\) oxygen by mass. Its empirical formula is:',
      options: ['\\(\\text{CH}_2\\text{O}\\)', '\\(\\text{CHO}\\)', '\\(\\text{CH}_3\\text{O}\\)', '\\(\\text{C}_2\\text{H}_4\\text{O}\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'mb5',
      text: 'If 10 g of \\(\\text{H}_2\\) reacts with 64 g of \\(\\text{O}_2\\) to form water, the limiting reagent and the mass of water formed are respectively:',
      options: ['\\(\\text{O}_2, 72\\text{ g}\\)', '\\(\\text{H}_2, 90\\text{ g}\\)', '\\(\\text{O}_2, 36\\text{ g}\\)', '\\(\\text{H}_2, 72\\text{ g}\\)'],
      correct: 0,
      difficulty: 'hard',
    }
  ],

  // --- Mathematics ---
  'sets-basic': [
    {
      id: 'sb1',
      text: 'If \\(A = \\{1, 2, 3, 4\\}\\) and \\(B = \\{3, 4, 5, 6\\}\\), then \\(A \\cap B\\) is:',
      options: ['\\(\\{1, 2\\}\\)', '\\(\\{3, 4\\}\\)', '\\(\\{5, 6\\}\\)', '\\(\\{1, 2, 3, 4, 5, 6\\}\\)'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'sb2',
      text: 'The number of subsets of a set containing \\(n\\) elements is:',
      options: ['\\(n^2\\)', '\\(2^n\\)', '\\(n!\\)', '\\(2^{n-1}\\)'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'sb3',
      text: 'In a school, 70% of students like cricket and 60% like football. If 40% like both, what percentage of students like neither?',
      options: ['\\(10\\%\\)', '\\(20\\%\\)', '\\(30\\%\\)', '\\(15\\%\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'sb4',
      text: 'If \\(A\\) and \\(B\\) are two sets such that \\(n(A) = 15\\), \\(n(B) = 20\\), and \\(n(A \\cup B) = 30\\), then \\(n(A \\cap B)\\) is:',
      options: ['\\(5\\)', '\\(10\\)', '\\(15\\)', '\\(0\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sb5',
      text: 'The symmetric difference \\(A \\Delta B\\) of two sets \\(A\\) and \\(B\\) is defined as:',
      options: ['\\((A \\setminus B) \\cup (B \\setminus A)\\)', '\\((A \\cup B) \\setminus (A \\cap B)\\)', 'Both A and B options are correct', 'None of these'],
      correct: 2,
      difficulty: 'medium',
    }
  ],
  'sets-relations': [
    {
      id: 'sr1',
      text: 'Let \\(R\\) be a relation on the set of natural numbers defined by \\(x R y\\) if \\(x + 2y = 10\\). The domain of \\(R\\) is:',
      options: ['\\(\\{2, 4, 6, 8\\}\\)', '\\(\\{1, 2, 3, 4\\}\\)', '\\(\\{2, 4, 6, 8, 10\\}\\)', '\\(\\{1, 3, 5, 7, 9\\}\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'sr2',
      text: 'The relation \\(R\\) on a set \\(A = \\{1, 2, 3\\}\\) defined by \\(R = \\{(1,1), (2,2), (3,3), (1,2), (2,1)\\}\\) is:',
      options: ['Equivalence relation', 'Reflexive and symmetric but not transitive', 'Symmetric and transitive but not reflexive', 'Reflexive but not symmetric'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'sr3',
      text: 'The domain of the real-valued function \\(f(x) = \\sqrt{9 - x^2}\\) is:',
      options: ['\\([-3, 3]\\)', '\\((-\\infty, 3]\\)', '\\([3, \\infty)\\)', '\\([-9, 9]\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sr4',
      text: 'The function \\(f: \\mathbb{R} \\to \\mathbb{R}\\) defined by \\(f(x) = x^3 + 5\\) is:',
      options: ['One-to-one and onto', 'One-to-one but not onto', 'Onto but not one-to-one', 'Neither one-to-one nor onto'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'sr5',
      text: 'If \\(f(x) = \\sin x\\) and \\(g(x) = x^2\\), then the composite function \\(g(f(x))\\) is:',
      options: ['\\(\sin^2 x\\)', '\\(\sin x^2\\)', '\\(x^2 \\sin x\\)', '\\(\sin(\\sin x)\\)'],
      correct: 0,
      difficulty: 'easy',
    }
  ],
  'complex-basic': [
    {
      id: 'cb1',
      text: 'The modulus of the complex number \\(z = 3 + 4i\\) is:',
      options: ['\\(3\\)', '\\(4\\)', '\\(5\\)', '\\(7\\)'],
      correct: 2,
      difficulty: 'easy',
    },
    {
      id: 'cb2',
      text: 'If \\(z = 1 + i\\), then the value of \\(z^2\\) is:',
      options: ['\\(2i\\)', '\\(2\\)', '\\(-2i\\)', '\\(1 + 2i\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'cb3',
      text: 'The multiplicative inverse of the complex number \\(z = 3 - 4i\\) is:',
      options: ['\\(\\frac{3}{25} + \\frac{4}{25}i\\)', '\\(\\frac{3}{25} - \\frac{4}{25}i\\)', '\\(3 + 4i\\)', '\\(\\frac{1}{3} - \\frac{1}{4}i\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'cb4',
      text: 'If \\(\\omega\\) is an imaginary cube root of unity, then the value of \\(1 + \\omega + \\omega^2\\) is:',
      options: ['\\(0\\)', '\\(1\\)', '\\(-1\\)', '\\(\\omega\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'cb5',
      text: 'The polar form of the complex number \\(z = 1 + i\\sqrt{3}\\) is:',
      options: ['\\(2\\left(\\cos\\frac{\\pi}{3} + i\\sin\\frac{\\pi}{3}\\right)\\)', '\\(2\\left(\\cos\\frac{\\pi}{6} + i\\sin\\frac{\\pi}{6}\\right)\\)', '\\(\\sqrt{2}\\left(\\cos\\frac{\\pi}{4} + i\\sin\\frac{\\pi}{4}\\right)\\)', '\\(\\cos\\frac{\\pi}{3} + i\\sin\\frac{\\pi}{3}\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'complex-geo': [
    {
      id: 'cg1',
      text: 'The locus of a complex number \\(z\\) satisfying the equation \\(|z - i| = |z + i|\\) is:',
      options: ['The real axis (x-axis)', 'The imaginary axis (y-axis)', 'A circle of radius 1', 'The line \\(y = x\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'cg2',
      text: 'The equation \\(|z - 2 - 3i| = 5\\) represents a circle in the Argand plane. Its center and radius are:',
      options: ['Center \\((2, 3)\\), Radius \\(5\\)', 'Center \\((-2, -3)\\), Radius \\(5\\)', 'Center \\((2, -3)\\), Radius \\(5\\)', 'Center \\((3, 2)\\), Radius \\(5\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'cg3',
      text: 'If \\(z_1\\) and \\(z_2\\) are two complex numbers, then \\(\\text{amp}(z_1 z_2) - \\text{amp}(z_1) - \\text{amp}(z_2)\\) is equal to:',
      options: ['\\(2k\\pi\\) (where \\(k\\) is an integer)', '\\(0\\)', '\\(\\pi\\)', '\\(-\\pi\\)'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'cg4',
      text: 'The area of the triangle on the Argand plane formed by the complex numbers \\(z\\), \\(iz\\), and \\(z + iz\\) is:',
      options: ['\\(\\frac{1}{2}|z|^2\\)', '\\(|z|^2\\)', '\\(\\frac{\\sqrt{3}}{4}|z|^2\\)', '\\(\\frac{1}{4}|z|^2\\)'],
      correct: 0,
      difficulty: 'hard',
    },
    {
      id: 'cg5',
      text: 'For any two complex numbers \\(z_1\\) and \\(z_2\\), which of the following is always true?',
      options: ['\\(|z_1 + z_2| \\le |z_1| + |z_2|\\)', '\\(|z_1 + z_2| \\ge |z_1| + |z_2|\\)', '\\(|z_1 - z_2| \\ge |z_1| + |z_2|\\)', '\\(|z_1 + z_2| = |z_1| + |z_2|\\)'],
      correct: 0,
      difficulty: 'easy',
    }
  ],
  'quadratic': [
    // Chapter key, we route via quad-basic
  ],
  'quad-basic': [
    {
      id: 'qb1',
      text: 'If the roots of the quadratic equation \\(x^2 + bx + c = 0\\) are real and equal, then which of the following is true?',
      options: ['\\(b^2 = 4c\\)', '\\(b^2 > 4c\\)', '\\(b^2 < 4c\\)', '\\(b = 4c\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'qb2',
      text: 'If \\(\\alpha\\) and \\(\\beta\\) are the roots of the equation \\(ax^2 + bx + c = 0\\), then the value of \\(\\alpha^2 + \\beta^2\\) is:',
      options: ['\\(\\frac{b^2 - 2ac}{a^2}\\)', '\\(\\frac{b^2 + 2ac}{a^2}\\)', '\\(\\frac{b^2 - 4ac}{a^2}\\)', '\\(\\frac{b^2 - ac}{a^2}\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'qb3',
      text: 'The condition that the roots of the equation \\(x^2 - px + q = 0\\) differ by unity is:',
      options: ['\\(p^2 - 4q = 1\\)', '\\(p^2 + 4q = 1\\)', '\\(q^2 - 4p = 1\\)', '\\(p^2 - 4q = 0\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'qb4',
      text: 'If one root of \\(x^2 - 5x + k = 0\\) is 2, then the other root and the value of \\(k\\) are:',
      options: ['Root = 3, k = 6', 'Root = -3, k = -6', 'Root = 3, k = -6', 'Root = 2, k = 4'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'qb5',
      text: 'The minimum value of the quadratic expression \\(f(x) = x^2 - 4x + 7\\) is:',
      options: ['\\(3\\)', '\\(7\\)', '\\(2\\)', '\\(11\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'sequences': [
    // Chapter route via seq-ap and seq-gp
  ],
  'seq-ap': [
    {
      id: 'sa1',
      text: 'The \\(n\\)th term of an AP whose first term is \\(a\\) and common difference is \\(d\\) is:',
      options: ['\\(a + nd\\)', '\\(a + (n-1)d\\)', '\\(a + (n+1)d\\)', '\\(na + d\\)'],
      correct: 1,
      difficulty: 'easy',
    },
    {
      id: 'sa2',
      text: 'The sum of first 20 terms of the AP \\(2, 5, 8, 11, \\dots\\) is:',
      options: ['\\(610\\)', '\\(590\\)', '\\(620\\)', '\\(600\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sa3',
      text: 'If the 5th and 12th terms of an AP are 30 and 65 respectively, then its 20th term is:',
      options: ['\\(105\\)', '\\(100\\)', '\\(110\\)', '\\(95\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'sa4',
      text: 'If \\(a, b, c\\) are in AP, then which of the following relations is correct?',
      options: ['\\(2b = a + c\\)', '\\(b^2 = ac\\)', '\\(b = a + c\\)', '\\(2a = b + c\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sa5',
      text: 'If the sum of \\(n\\) terms of an AP is given by \\(S_n = 3n^2 + 5n\\), then its common difference is:',
      options: ['\\(6\\)', '\\(3\\)', '\\(5\\)', '\\(2\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'seq-gp': [
    {
      id: 'sg1',
      text: 'The sum of an infinite geometric progression with first term \\(a\\) and common ratio \\(r\\) (where \\(|r| < 1\\)) is:',
      options: ['\\(\\frac{a}{1-r}\\)', '\\(\\frac{a}{1+r}\\)', '\\(\\frac{a(1-r^n)}{1-r}\\)', '\\(a r^{n-1}\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sg2',
      text: 'If \\(3, x, 12\\) are in GP, then the value of \\(x\\) (where \\(x > 0\\)) is:',
      options: ['\\(6\\)', '\\(7.5\\)', '\\(9\\)', '\\(36\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sg3',
      text: 'The 6th term of the GP \\(2, 6, 18, 54, \\dots\\) is:',
      options: ['\\(486\\)', '\\(162\\)', '\\(1458\\)', '\\(243\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sg4',
      text: 'The sum of the infinite series \\(1 + \\frac{1}{3} + \\frac{1}{9} + \\frac{1}{27} + \\dots\\) is:',
      options: ['\\(3/2\\)', '\\(4/3\\)', '\\(2\\)', '\\(1.5\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'sg5',
      text: 'If the 3rd and 6th terms of a GP are 12 and 96 respectively, the first term is:',
      options: ['\\(3\\)', '\\(4\\)', '\\(6\\)', '\\(2\\)'],
      correct: 0,
      difficulty: 'medium',
    }
  ],
  'trig-basic': [
    {
      id: 'tb1',
      text: 'The value of \\(\\sin(120°)\\) is:',
      options: ['\\(\\frac{sqrt{3}}{2}\\)', '\\(-\\frac{\\sqrt{3}}{2}\\)', '\\(\\frac{1}{2}\\)', '\\(-\\frac{1}{2}\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'tb2',
      text: 'The maximum value of the expression \\(3\\sin\\theta + 4\\cos\\theta\\) is:',
      options: ['\\(5\\)', '\\(7\\)', '\\(1\\)', '\\(25\\)'],
      correct: 0,
      difficulty: 'easy',
    },
    {
      id: 'tb3',
      text: 'If \\(\\tan\\theta = \\frac{3}{4}\\) and \\(\\theta\\) is in the third quadrant, the value of \\(\\sin\\theta\\) is:',
      options: ['\\(-\\frac{3}{5}\\)', '\\(\\frac{3}{5}\\)', '\\(-\\frac{4}{5}\\)', '\\(\\frac{4}{5}\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'tb4',
      text: 'The value of \\(\\tan(75°)\\) is:',
      options: ['\\(2+\\sqrt{3}\\)', '\\(2-\\sqrt{3}\\)', '\\(\\sqrt{3}-1\\)', '\\(\\sqrt{3}+1\\)'],
      correct: 0,
      difficulty: 'medium',
    },
    {
      id: 'tb5',
      text: 'Which of the following is equivalent to \\(\\cos(2\\theta)\\)?',
      options: ['\\(\\cos^2\\theta - \\sin^2\\theta\\)', '\\(2\\cos^2\\theta - 1\\)', '\\(1 - 2\\sin^2\\theta\\)', 'All of these'],
      correct: 3,
      difficulty: 'easy',
    }
  ]
};

// Return questions for KC
export function getQuestions(kcId) {
  if (questions[kcId]) return questions[kcId];
  return [];
}

// ——————————————————————————————————————————————
// NOTES
// ——————————————————————————————————————————————

export const notes = [];

// ——————————————————————————————————————————————
// LEADERBOARD
// ——————————————————————————————————————————————

export const students = [
  { id: 'u1', name: 'Rushil Sunder', initials: 'RS', color: '#818cf8', questions: 0, accuracy: 0, mastery: 0, time: '0m', isYou: true },
  { id: 'u2', name: 'Aadhav Krishna G', initials: 'AK', color: '#4ade80', questions: 245, accuracy: 91, mastery: 72, time: '5h 45m', isYou: false },
  { id: 'u3', name: 'Naga Karthik', initials: 'NK', color: '#f87171', questions: 312, accuracy: 85, mastery: 75, time: '9h 10m', isYou: false },
  { id: 'u4', name: 'Akshit Kabra', initials: 'AK', color: '#fbbf24', questions: 180, accuracy: 70, mastery: 55, time: '4h 30m', isYou: false },
  { id: 'u5', name: 'Nabh Patawari', initials: 'NP', color: '#fb923c', questions: 89, accuracy: 62, mastery: 35, time: '2h 15m', isYou: false },
  { id: 'u6', name: 'Advay Paul T', initials: 'AP', color: '#67e8f9', questions: 156, accuracy: 82, mastery: 60, time: '3h 50m', isYou: false },
  { id: 'u7', name: 'Taranrajan Shankar', initials: 'TS', color: '#e879f9', questions: 210, accuracy: 76, mastery: 58, time: '6h 40m', isYou: false },
  { id: 'u8', name: 'Rohan Mehta', initials: 'RM', color: '#a78bfa', questions: 275, accuracy: 88, mastery: 71, time: '7h 55m', isYou: false },
];
