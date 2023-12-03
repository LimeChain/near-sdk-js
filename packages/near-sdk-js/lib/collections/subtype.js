import { LookupMap } from "./lookup-map";
import { LookupSet } from "./lookup-set";
import { UnorderedSet } from "./unordered-set";
import { Vector } from "./vector";
import { UnorderedMap } from "./unordered-map";
export const LOOKUP_MAP_SCHE = "lookup_map";
export const LOOKUP_SET_SCHE = "lookup_set";
export const UNORDERED_MAP_SCHE = "unordered_map";
export const UNORDERED_SET_SCHE = "unordered_set";
export const VECTOR_SCHE = "vector";
export class SubType {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/no-empty-function */
    subtype() {
    }
    set_reconstructor(options) {
        if ((options == undefined || (options.reconstructor == undefined)) && this.subtype() != undefined) {
            // eslint-disable-next-line no-prototype-builtins
            if (this.subtype().hasOwnProperty(UNORDERED_MAP_SCHE)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                options.reconstructor = UnorderedMap.reconstruct;
                // eslint-disable-next-line no-prototype-builtins
            }
            else if (this.subtype().hasOwnProperty(LOOKUP_MAP_SCHE)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                options.reconstructor = LookupMap.reconstruct;
                // eslint-disable-next-line no-prototype-builtins
            }
            else if (this.subtype().hasOwnProperty(LOOKUP_SET_SCHE)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                options.reconstructor = LookupSet.reconstruct;
                // eslint-disable-next-line no-prototype-builtins
            }
            else if (this.subtype().hasOwnProperty(UNORDERED_SET_SCHE)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                options.reconstructor = UnorderedSet.reconstruct;
                // eslint-disable-next-line no-prototype-builtins
            }
            else if (this.subtype().hasOwnProperty(VECTOR_SCHE)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                options.reconstructor = Vector.reconstruct;
            }
        }
        return options;
    }
}
