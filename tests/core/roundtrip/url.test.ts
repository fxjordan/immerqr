import { describe } from 'vitest';
import { CORPUS } from '../../fixtures/corpus';
import { roundTripSuite } from '../../helpers/roundtrip';

describe('round-trip decode: url', () => roundTripSuite(CORPUS.url));
