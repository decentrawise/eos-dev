/**
 *  @file
 *  @copyright defined in eos/LICENSE.txt
 */
#include "emancontent.hpp"
//#include <eosiolib/crypto.h>
#include <string.h>

namespace emanate
{

template<typename callback>
void content::updateStats(account_name owner, uint64_t hash, callback &&l)
{
    assetTable assets(_self, owner);

    auto iter = assets.find(hash);
    eosio_assert(iter != assets.end(), "asset not found");
    
    assets.modify( iter, owner, l );
}

void content::addtrack(account_name owner, uint64_t id, const std::string &metadata)
{
    require_auth( owner );

    assetTable assets( _self, owner );

    assets.emplace( owner, [&]( auto &asset )
    {
        asset.id = id;
        asset.metadata = metadata;
        asset.totalSecondsPlayed = 0;
        asset.totalTimesPlayed = 0;
        printui(asset.id);
    });
}

void content::removetrack(account_name owner, uint64_t id)
{
    require_auth( owner );

    {
        assetTable assets(_self, owner);

        auto iter = assets.find(id);
        eosio_assert(iter != assets.end(), "asset not found");
        assets.erase(iter);
    }
}

void content::updatetrack(account_name owner, uint64_t id, const std::string &metadata)
{
    assetTable assets(_self, owner);

    auto iter = assets.find(id);
    eosio_assert(iter != assets.end(), "asset not found");
    
    assets.modify( iter, owner, [&](auto &asset){
        asset.metadata = metadata;
    });
}

void content::startplaying(account_name owner, uint64_t id)
{
    updateStats(owner, id, [&]( auto &assetRecord )
    {
        assetRecord.totalTimesPlayed++;
    });
}

void content::play(account_name owner, uint64_t id, uint64_t seconds)
{
    updateStats(owner, id, [&]( auto &assetRecord )
    {
        assetRecord.totalSecondsPlayed += seconds;
    });
}

EOSIO_ABI( content, (addtrack)(removetrack)(updatetrack)(startplaying)(play) )


}   // namespace emanate
