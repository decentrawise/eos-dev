/**
 *  @file
 *  @copyright defined in eos/LICENSE.txt
 */
#include "emancontent.hpp"
#include <eosiolib/crypto.h>
#include <string.h>

namespace emanate
{

uint64_t content::calculateChecksum(const std::string &str)
{
    uint64_t result = 0;
    checksum256 checksum;
    sha256(const_cast<char *>(str.c_str()), str.size(), &checksum);
    memcpy(&result, &checksum, sizeof(result));
    return result;
}

template<typename callback>
void content::updateStats(account_name owner, const std::string &title, callback &&l)
{
    statTable stats( _self, owner );
    uint64_t checksum = calculateChecksum(title);

    auto iter = stats.find( checksum );
    eosio_assert( iter != stats.end(), "could not find the statistics for this title" );

    stats.modify( iter, owner, l);
}

void content::addtrack(account_name owner, const std::string &title, const std::string &metadata)
{
    require_auth( owner );

    uint64_t checksum = calculateChecksum(title);
    trackTable tracks( _self, owner );

    tracks.emplace( owner, [&]( auto &track )
    {
        track.id = tracks.available_primary_key();
        track.checksum = checksum;
        track.title = title;
        track.metadata = metadata;
    });

    statTable stats( _self, owner );
    stats.emplace( owner, [&] (auto &statRecord)
    {
        prints("Adding statistics");
        printui(checksum);
        statRecord.id = checksum;
        statRecord.totalSecondsPlayed = 0;
        statRecord.totalTimesPlayed = 0;
    });
}

void content::removetrack(account_name owner, const std::string &title)
{
    require_auth( owner );

    uint64_t checksum = calculateChecksum(title);
    
    {
        trackTable tracks(_self, owner);
        auto secondary_index = tracks.get_index<track::secondaryName>();
        secondary_index.find(checksum);

        auto iter = secondary_index.find(checksum);
        eosio_assert(iter != secondary_index.end(), "track not found");

        secondary_index.erase(iter);
    }
    {
        statTable stats(_self, owner);
        auto iter = stats.find(checksum);
        eosio_assert(iter != stats.end(), "stats not found");
        stats.erase(iter);
    }
}

void content::startplaying(account_name owner, const std::string &title)
{
    updateStats(owner, title, [&]( auto &statRecord )
    {
        statRecord.totalTimesPlayed++;
    });
}

void content::play(account_name owner, const std::string &title, uint64_t seconds)
{
    updateStats(owner, title, [&]( auto &statRecord )
    {
        statRecord.totalSecondsPlayed += seconds;
    });
}

EOSIO_ABI( content, (addtrack)(removetrack)(startplaying)(play) )


}   // namespace emanate
