/**
 *  @file
 *  @copyright defined in eos/LICENSE.txt
 */
#include "emancontent.hpp"

namespace emanate
{
    
void content::addtrack(account_name owner, const trackMetadata &metadata)
{
    require_auth( owner );
    
    trackTable tracks( _self, owner );

    tracks.emplace( owner, [&]( auto &track )
    {
        track.id = tracks.available_primary_key();
        track.title = metadata.trackName;   //  extract from the json metadata
        track.metadata = metadata;
    });
}

EOSIO_ABI( emanate::content, (addtrack) )


}   // namespace emanate
