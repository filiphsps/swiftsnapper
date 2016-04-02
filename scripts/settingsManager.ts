module SwiftSnapper {
    module Settings {
        export function Get(item) {
            return localStorage.getItem('_s_' + item);
        }
        export function Set(item, data) {
            localStorage.setItem('_s_' + item, data);
        }
    }
}